"""Database package for Lexora.

Provides:
* ``schema``       - DDL for both SQLite (local/dev/test) and PostgreSQL (Supabase).
* ``repository``   - the single Repository façade used by the whole backend.
* ``storage``      - storage backends (SQLite file and Supabase PostgREST).
"""

from .repository import Repository, get_repository

__all__ = ["Repository", "get_repository"]