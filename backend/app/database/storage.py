"""Storage backends: SQLite (local, default, testable) and Supabase PostgreSQL.

Both backends expose the same low-level API so the ``Repository`` façade in
``repository.py`` does not care which one is in use.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from typing import Any, Iterable

import httpx

from ..config import settings

_DB_LOCK = threading.Lock()


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, default=str)


class StorageError(Exception):
    pass


# ---------------------------------------------------------------------------
# SQLite
# ---------------------------------------------------------------------------

_SCHEMA_SQL = None


def _schema_sql() -> str:
    global _SCHEMA_SQL
    if _SCHEMA_SQL is None:
        schema_path = __import__("pathlib").Path(__file__).parent / "schema.sql"
        _SCHEMA_SQL = schema_path.read_text(encoding="utf-8")
    return _SCHEMA_SQL


class SqliteStorage:
    """Thread-safe SQLite storage."""

    def __init__(self, path: str):
        self.path = path
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_schema(self) -> None:
        with _DB_LOCK:
            conn = self._connect()
            try:
                conn.executescript(_schema_sql())
                conn.commit()
            finally:
                conn.close()

    # -- generic helpers ----------------------------------------------------

    def insert(self, table: str, data: dict) -> dict:
        if not data:
            raise StorageError("empty insert")
        keys = list(data.keys())
        cols = ", ".join(keys)
        qmarks = ", ".join(["?"] * len(keys))
        sql = f"INSERT INTO {table} ({cols}) VALUES ({qmarks})"
        values = [data[k] for k in keys]
        with _DB_LOCK:
            conn = self._connect()
            try:
                cur = conn.execute(sql, values)
                conn.commit()
                new = {**data, "id": cur.lastrowid if "id" not in data else data["id"]}
                return new
            finally:
                conn.close()

    def upsert(self, table: str, data: dict, conflict_col: str) -> dict:
        keys = list(data.keys())
        cols = ", ".join(keys)
        qmarks = ", ".join(["?"] * len(keys))
        placeholders = ", ".join(
            f"{k}=excluded.{k}" for k in keys if k != conflict_col
        )
        sql = (
            f"INSERT INTO {table} ({cols}) VALUES ({qmarks}) "
            f"ON CONFLICT({conflict_col}) DO UPDATE SET {placeholders}"
        )
        values = [data[k] for k in keys]
        with _DB_LOCK:
            conn = self._connect()
            try:
                conn.execute(sql, values)
                conn.commit()
                return data
            finally:
                conn.close()

    def get(self, table: str, where: dict) -> dict | None:
        if not where:
            return None
        clause = " AND ".join(f"{k} = ?" for k in where)
        values = [where[k] for k in where]
        with _DB_LOCK:
            conn = self._connect()
            try:
                row = conn.execute(
                    f"SELECT * FROM {table} WHERE {clause} LIMIT 1", values
                ).fetchone()
                return dict(row) if row else None
            finally:
                conn.close()

    def list_rows(
        self,
        table: str,
        where: dict | None = None,
        order_by: str | None = None,
        order_dir: str = "ASC",
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict]:
        sql = f"SELECT * FROM {table}"
        values: list[Any] = []
        if where:
            clause = " AND ".join(f"{k} = ?" for k in where)
            sql += f" WHERE {clause}"
            values = [where[k] for k in where]
        if order_by:
            sql += f" ORDER BY {order_by} {order_dir}"
        if limit is not None:
            sql += " LIMIT ? OFFSET ?"
            values += [limit, offset]
        with _DB_LOCK:
            conn = self._connect()
            try:
                rows = conn.execute(sql, values).fetchall()
                return [dict(r) for r in rows]
            finally:
                conn.close()

    def update(self, table: str, data: dict, where: dict) -> None:
        if not data or not where:
            return
        sets = ", ".join(f"{k} = ?" for k in data)
        clause = " AND ".join(f"{k} = ?" for k in where)
        values = list(data.values()) + list(where.values())
        with _DB_LOCK:
            conn = self._connect()
            try:
                conn.execute(f"UPDATE {table} SET {sets} WHERE {clause}", values)
                conn.commit()
            finally:
                conn.close()

    def delete(self, table: str, where: dict) -> None:
        if not where:
            return
        clause = " AND ".join(f"{k} = ?" for k in where)
        values = [where[k] for k in where]
        with _DB_LOCK:
            conn = self._connect()
            try:
                conn.execute(f"DELETE FROM {table} WHERE {clause}", values)
                conn.commit()
            finally:
                conn.close()

    def count(self, table: str, where: dict | None = None) -> int:
        sql = f"SELECT COUNT(*) AS c FROM {table}"
        values: list[Any] = []
        if where:
            clause = " AND ".join(f"{k} = ?" for k in where)
            sql += f" WHERE {clause}"
            values = [where[k] for k in where]
        with _DB_LOCK:
            conn = self._connect()
            try:
                row = conn.execute(sql, values).fetchone()
                return int(row["c"]) if row else 0
            finally:
                conn.close()

    def query(self, sql: str, values: Iterable[Any] = ()) -> list[dict]:
        with _DB_LOCK:
            conn = self._connect()
            try:
                rows = conn.execute(sql, list(values)).fetchall()
                return [dict(r) for r in rows]
            finally:
                conn.close()


# ---------------------------------------------------------------------------
# Supabase (PostgREST)
# ---------------------------------------------------------------------------


class SupabaseStorage:
    """PostgREST-based storage over a Supabase project."""

    def __init__(self, url: str, service_role_key: str):
        if not url or not service_role_key:
            raise StorageError("Supabase URL / service role key not configured")
        self.url = url.rstrip("/")
        self.key = service_role_key
        self._client = httpx.Client(timeout=30)

    def _headers(self, prefer: str = "return=representation") -> dict:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": prefer,
        }

    def _base(self, table: str) -> str:
        return f"{self.url}/rest/v1/{table}"

    def insert(self, table: str, data: dict) -> dict:
        resp = self._client.post(self._base(table), json=data, headers=self._headers())
        if resp.status_code >= 400:
            raise StorageError(f"Supabase insert {table}: {resp.text}")
        rows = resp.json()
        return rows[0] if rows else data

    def upsert(self, table: str, data: dict, conflict_col: str) -> dict:
        headers = self._headers()
        headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        resp = self._client.post(
            f"{self._base(table)}?on_conflict={conflict_col}",
            json=[data],
            headers=headers,
        )
        if resp.status_code >= 400:
            raise StorageError(f"Supabase upsert {table}: {resp.text}")
        rows = resp.json()
        return rows[0] if rows else data

    def get(self, table: str, where: dict) -> dict | None:
        params = []
        for k, v in where.items():
            params.append(f"{k}=eq.{self._fmt(v)}")
        url = self._base(table) + "?" + "&".join(params) + "&limit=1"
        resp = self._client.get(url, headers=self._headers())
        if resp.status_code >= 400:
            raise StorageError(f"Supabase get {table}: {resp.text}")
        rows = resp.json()
        return rows[0] if rows else None

    def list_rows(
        self,
        table: str,
        where: dict | None = None,
        order_by: str | None = None,
        order_dir: str = "ASC",
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict]:
        params = []
        if where:
            for k, v in where.items():
                params.append(f"{k}=eq.{self._fmt(v)}")
        if order_by:
            params.append(f"order={order_by}.{order_dir.lower()}")
        if limit is not None:
            params.append(f"limit={limit}")
            params.append(f"offset={offset}")
        url = self._base(table) + ("?" + "&".join(params) if params else "")
        resp = self._client.get(url, headers=self._headers())
        if resp.status_code >= 400:
            raise StorageError(f"Supabase list {table}: {resp.text}")
        return resp.json()

    def update(self, table: str, data: dict, where: dict) -> None:
        params = []
        for k, v in where.items():
            params.append(f"{k}=eq.{self._fmt(v)}")
        url = self._base(table) + ("?" + "&".join(params) if params else "")
        resp = self._client.patch(url, json=data, headers=self._headers())
        if resp.status_code >= 400:
            raise StorageError(f"Supabase update {table}: {resp.text}")

    def delete(self, table: str, where: dict) -> None:
        params = []
        for k, v in where.items():
            params.append(f"{k}=eq.{self._fmt(v)}")
        url = self._base(table) + ("?" + "&".join(params) if params else "")
        resp = self._client.delete(url, headers=self._headers())
        if resp.status_code >= 400:
            raise StorageError(f"Supabase delete {table}: {resp.text}")

    def count(self, table: str, where: dict | None = None) -> int:
        params = ["select=id"]
        if where:
            for k, v in where.items():
                params.append(f"{k}=eq.{self._fmt(v)}")
        url = self._base(table) + "?" + "&".join(params)
        headers = self._headers()
        headers["Prefer"] = "count=exact"
        resp = self._client.get(url, headers=headers)
        if resp.status_code >= 400:
            raise StorageError(f"Supabase count {table}: {resp.text}")
        try:
            return int(resp.headers.get("content-range", "0/0").split("/")[-1])
        except ValueError:
            return len(resp.json())

    def query(self, sql: str, values: Iterable[Any] = ()) -> list[dict]:
        raise StorageError("Raw SQL is not available on Supabase PostgREST")

    @staticmethod
    def _fmt(v: Any) -> str:
        if isinstance(v, bool):
            return "true" if v else "false"
        s = str(v)
        if " " in s or s in ("null", "true", "false"):
            s = '"' + s.replace('"', '""') + '"'
        return s


def create_storage() -> SqliteStorage | SupabaseStorage:
    """Instantiate the configured storage backend."""
    if settings.database_backend == "supabase":
        return SupabaseStorage(settings.supabase_url, settings.supabase_service_role_key)
    return SqliteStorage(settings.sqlite_path)