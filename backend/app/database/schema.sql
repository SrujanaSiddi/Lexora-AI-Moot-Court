-- Lexora schema
-- This file works on both SQLite (local development / tests) and
-- PostgreSQL (Supabase).  The storage backends create the same logical model.

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    full_name     TEXT,
    password_hash TEXT,
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
    id                 TEXT PRIMARY KEY,
    user_id            TEXT NOT NULL,
    title              TEXT NOT NULL,
    area               TEXT,
    source_type        TEXT DEFAULT 'proposition',
    original_filename  TEXT,
    storage_path       TEXT,
    status             TEXT DEFAULT 'processing',
    side               TEXT,
    chunk_count        INTEGER DEFAULT 0,
    faiss_count        INTEGER DEFAULT 0,
    bm25_ready         INTEGER DEFAULT 0,
    extracted_preview  TEXT,
    created_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS case_documents (
    id            TEXT PRIMARY KEY,
    case_id       TEXT NOT NULL,
    document_type TEXT DEFAULT 'case',
    filename      TEXT,
    storage_path  TEXT,
    page_count    INTEGER DEFAULT 0,
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    chunk_uid     TEXT UNIQUE NOT NULL,
    case_id       TEXT NOT NULL,
    document_id   TEXT,
    document_type TEXT DEFAULT 'case',
    source_name   TEXT,
    chunk_index   INTEGER,
    page          INTEGER,
    section       TEXT,
    text          TEXT NOT NULL,
    embedding_id  INTEGER,
    created_at    TEXT NOT NULL
);

-- For PostgreSQL the AUTOINCREMENT column becomes:
--   id BIGSERIAL PRIMARY KEY
-- (Supabase migration below.)

CREATE TABLE IF NOT EXISTS retrieval_sources (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    chunk_uid   TEXT NOT NULL,
    case_id     TEXT NOT NULL,
    rank        INTEGER,
    score       REAL,
    method      TEXT DEFAULT 'hybrid',
    query       TEXT,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    case_id    TEXT,
    session_type TEXT DEFAULT 'practice',
    phase      TEXT DEFAULT 'welcome',
    status     TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    meta_json  TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issues (
    id                   TEXT PRIMARY KEY,
    case_id              TEXT NOT NULL,
    user_id              TEXT NOT NULL,
    statement            TEXT,
    legal_basis_json     TEXT,
    supporting_sources_json TEXT,
    status               TEXT DEFAULT 'open',
    created_at           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS laws (
    id          TEXT PRIMARY KEY,
    case_id     TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    name        TEXT,
    provision   TEXT,
    reason      TEXT,
    source      TEXT,
    page        INTEGER,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS precedents (
    id         TEXT PRIMARY KEY,
    case_id    TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    name       TEXT,
    citation   TEXT,
    summary    TEXT,
    notes      TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS arguments (
    id                        TEXT PRIMARY KEY,
    case_id                   TEXT NOT NULL,
    user_id                   TEXT NOT NULL,
    issue_id                  TEXT,
    viewpoint                 TEXT DEFAULT 'petitioner',
    law_text                  TEXT,
    supporting_precedents_json TEXT,
    argument_text             TEXT,
    counterargument_text      TEXT,
    rebuttal_text             TEXT,
    evidence_json             TEXT,
    created_at                TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memorials (
    id              TEXT PRIMARY KEY,
    case_id         TEXT NOT NULL,
    user_id         TEXT NOT NULL,
    filename        TEXT,
    storage_path    TEXT,
    extracted_text  TEXT,
    parties         TEXT,
    jurisdiction    TEXT,
    issues_json     TEXT,
    summary_arguments TEXT,
    arguments_json  TEXT,
    provisions_json TEXT,
    precedents_json TEXT,
    relief          TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memorial_scores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    memorial_id TEXT NOT NULL,
    dimension   TEXT NOT NULL,
    score       REAL NOT NULL,
    evidence_json TEXT,
    feedback    TEXT,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oral_sessions (
    id                 TEXT PRIMARY KEY,
    case_id            TEXT NOT NULL,
    user_id            TEXT NOT NULL,
    side               TEXT,
    difficulty         TEXT DEFAULT 'easy',
    status             TEXT DEFAULT 'active',
    start_time         TEXT,
    end_time           TEXT,
    transcript_json    TEXT,
    created_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oral_transcripts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    oral_session_id TEXT NOT NULL,
    speaker         TEXT NOT NULL,
    content         TEXT NOT NULL,
    phase           TEXT,
    timestamp       TEXT,
    meta_json       TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS judge_interactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    oral_session_id TEXT NOT NULL,
    judge_question  TEXT,
    student_answer  TEXT,
    retrieved_sources_json TEXT,
    evaluation_json TEXT,
    interruption    INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS performance_scores (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL,
    case_id      TEXT,
    session_type TEXT NOT NULL,
    dimension    TEXT NOT NULL,
    value        REAL NOT NULL,
    evidence_json TEXT,
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS final_feedback (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    oral_session_id TEXT NOT NULL,
    overall_score   REAL,
    sections_json   TEXT,
    report_text     TEXT,
    difficulty_next TEXT,
    created_at      TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Supabase / PostgreSQL migration snippet
-- (pasted into the Supabase SQL editor once. SQLite uses the DDL above:
--  swap AUTOINCREMENT for GENERATED ALWAYS AS IDENTITY on PostgreSQL.)
-- ---------------------------------------------------------------------------
-- CREATE TABLE IF NOT EXISTS document_chunks (
--     id            BIGSERIAL PRIMARY KEY,
--     chunk_uid     TEXT UNIQUE NOT NULL,
--     case_id       TEXT NOT NULL,
--     document_id   TEXT,
--     document_type TEXT DEFAULT 'case',
--     source_name   TEXT,
--     chunk_index   INTEGER,
--     page          INTEGER,
--     section       TEXT,
--     text          TEXT NOT NULL,
--     embedding_id  INTEGER,
--     created_at    TEXT NOT NULL
-- );
-- CREATE INDEX IF NOT EXISTS idx_chunks_case ON document_chunks(case_id);
-- CREATE INDEX IF NOT EXISTS idx_sources_case ON retrieval_sources(case_id);
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "users own cases" ON cases FOR ALL USING (auth.uid()::text = user_id);