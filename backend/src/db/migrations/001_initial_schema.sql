CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE document_status AS ENUM ('UPLOADED', 'QUEUED', 'EXTRACTING', 'CHUNKING', 'EMBEDDING', 'READY', 'FAILED');
CREATE TYPE acl_permission AS ENUM ('READ', 'WRITE', 'ADMIN');

CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(21) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(21) PRIMARY KEY,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    file_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(1024) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    status document_status NOT NULL DEFAULT 'UPLOADED',
    error_message TEXT,
    textract_job_id VARCHAR(255),
    total_pages INTEGER,
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_acl (
    acl_id VARCHAR(21) PRIMARY KEY,
    document_id VARCHAR(21) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    user_id VARCHAR(255) NOT NULL,
    permission acl_permission NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parent_clauses (
    clause_id VARCHAR(21) PRIMARY KEY,
    document_id VARCHAR(21) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    clause_identifier VARCHAR(255),
    title TEXT,
    full_text TEXT NOT NULL,
    hierarchy_path TEXT,
    start_page INTEGER,
    end_page INTEGER,
    token_count INTEGER
);

CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id VARCHAR(21) PRIMARY KEY,
    clause_id VARCHAR(21) NOT NULL REFERENCES parent_clauses(clause_id) ON DELETE CASCADE,
    document_id VARCHAR(21) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INTEGER,
    coordinates JSONB NOT NULL,
    embedding vector(1024) NOT NULL,
    embedding_model VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS search_log (
    log_id VARCHAR(21) PRIMARY KEY,
    tenant_id VARCHAR(21) NOT NULL REFERENCES tenants(tenant_id),
    user_id VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    document_ids VARCHAR(21)[],
    limit_value INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_acl_user_id ON document_acl(user_id);
CREATE INDEX IF NOT EXISTS idx_document_acl_document_id ON document_acl(document_id);
CREATE INDEX IF NOT EXISTS idx_parent_clauses_document_id ON parent_clauses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_clause_id ON document_chunks(clause_id);

-- HNSW Vector Index for fast similarity search using cosine distance
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
