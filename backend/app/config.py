"""Central application configuration.

Everything is environment driven.  The same code base supports:

* API-based LLMs (Groq by default, any OpenAI-compatible endpoint via
  ``LLM_BASE_URL`` / ``LLM_API_KEY`` / ``LLM_MODEL``),
* local/backend embedding models (``all-mpnet-base-v2`` default,
  ``Alibaba-NLP/gte-Qwen2-1.5B-instruct`` alternative),
* a Supabase PostgreSQL backend for the database,
  falling back to a local SQLite file when Supabase credentials are absent
  (so tests and offline development keep working).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# Load the repository-root .env (backend/ is created inside the repo root).
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
REPO_DIR = BASE_DIR.parent

load_dotenv(REPO_DIR / ".env")
load_dotenv(BASE_DIR / ".env")


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_int(value: str | None, default: int) -> int:
    try:
        return int(value) if value not in (None, "") else default
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Settings:
    # --- App ---
    app_name: str = "Lexora API"
    debug: bool = field(default_factory=lambda: _as_bool(os.getenv("DEBUG")))
    secret_key: str = os.getenv("SECRET_KEY", "lexora-dev-secret-change-me")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = field(
        default_factory=lambda: _as_int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"), 60 * 24 * 7)
    )

    # --- Database ---
    # "supabase" (PostgreSQL via PostgREST) or "sqlite" (local file).
    database_backend: str = os.getenv("DATABASE_BACKEND", "sqlite").strip().lower()
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    sqlite_path: str = os.getenv("SQLITE_PATH", str(BASE_DIR / "data" / "lexora.db"))

    # --- Storage / FAISS ---
    data_dir: str = os.getenv("DATA_DIR", str(BASE_DIR / "data"))
    faiss_dir: str = os.getenv("FAISS_DIR", str(BASE_DIR / "data" / "faiss"))
    uploads_dir: str = os.getenv("UPLOADS_DIR", str(BASE_DIR / "data" / "uploads"))

    # --- LLM ---
    llm_provider: str = os.getenv("LLM_PROVIDER", "groq").strip().lower()
    llm_model: str = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    llm_base_url: str = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
    llm_temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    llm_max_tokens: int = field(default_factory=lambda: _as_int(os.getenv("LLM_MAX_TOKENS"), 2048))
    # If > 0, the LLM is asked to emit a JSON object (used for structured outputs).
    llm_json_timeout: float = field(default_factory=lambda: _as_int(os.getenv("LLM_JSON_TIMEOUT"), 60))
    # "fake" provider produces canned outputs; only used by tests / demos.
    llm_fake_mode: bool = field(default_factory=lambda: _as_bool(os.getenv("LLM_FAKE_MODE")))

    # --- Embeddings ---
    # Primary literature-backed embedding model.
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-mpnet-base-v2")
    # GTE-Qwen2-1.5B is the configured alternative.
    embedding_alternative: str = os.getenv(
        "EMBEDDING_ALTERNATIVE", "Alibaba-NLP/gte-Qwen2-1.5B-instruct"
    )
    embedding_device: str = os.getenv("EMBEDDING_DEVICE", "cpu")
    embedding_batch_size: int = field(default_factory=lambda: _as_int(os.getenv("EMBEDDING_BATCH_SIZE"), 32))

    # --- Legal representation model (InLegalBERT) ---
    legal_model: str = os.getenv("LEGAL_MODEL", "law-ai/InLegalBERT")

    # --- NLI model (RoBERTa-MNLI) ---
    nli_model: str = os.getenv("NLI_MODEL", "cross-encoder/nli-roberta-base")

    # --- Speech ---
    stt_model: str = os.getenv("STT_MODEL", "base")
    stt_device: str = os.getenv("STT_DEVICE", "cpu")
    tts_provider: str = os.getenv("TTS_PROVIDER", "edge").strip().lower()
    tts_voice: str = os.getenv("TTS_VOICE", "en-IN-NeerjaNeural")

    # --- Retrieval ---
    retrieval_top_k: int = field(default_factory=lambda: _as_int(os.getenv("RETRIEVAL_TOP_K"), 6))
    rrf_k: int = field(default_factory=lambda: _as_int(os.getenv("RRF_K"), 60))

    # --- CORS ---
    cors_origins: list[str] = field(
        default_factory=lambda: [
            o.strip()
            for o in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
            ).split(",")
            if o.strip()
        ]
    )

    def llm_api_key_resolved(self) -> str:
        """Provider-specific API key resolution."""
        if self.llm_api_key:
            return self.llm_api_key
        if self.llm_provider == "groq":
            return self.groq_api_key
        return self.groq_api_key

    @property
    def chunks_dir(self) -> str:
        return os.path.join(self.data_dir, "chunks")

    def ensure_dirs(self) -> None:
        for d in (self.data_dir, self.faiss_dir, self.uploads_dir, self.chunks_dir):
            Path(d).mkdir(parents=True, exist_ok=True)
        if self.database_backend == "sqlite":
            Path(self.sqlite_path).parent.mkdir(parents=True, exist_ok=True)


settings = Settings()