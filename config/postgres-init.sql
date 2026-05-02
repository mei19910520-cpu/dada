-- AI R&D Department — PostgreSQL 初始化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- task_queue — AI 員工協作任務佇列（Phase 2 核心）
-- 與 Notion Tasks DB 雙向同步，PostgreSQL 為一級快取
-- ============================================================
CREATE TABLE IF NOT EXISTS task_queue (
  task_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notion_page_id   TEXT,
  assignee         TEXT NOT NULL,           -- 00 / 01 / 02 / 03 / 04 / 05 / 06
  task_type        TEXT NOT NULL,           -- analysis / strategy / ux / knowledge / form / data_eng / arbitration
  priority         TEXT NOT NULL DEFAULT 'P2',  -- P0 / P1 / P2 / P3
  status           TEXT NOT NULL DEFAULT 'pending', -- pending / running / blocked / done / failed
  input_payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload   JSONB,
  parent_task_id   UUID REFERENCES task_queue(task_id) ON DELETE SET NULL,
  chain_depth      INT NOT NULL DEFAULT 0,  -- 防死迴圈，超過 5 層阻斷
  created_by       TEXT,                    -- workflow id 或 employee id
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  due_at           TIMESTAMPTZ,
  retry_count      INT NOT NULL DEFAULT 0,
  cost_usd         NUMERIC(10, 6) DEFAULT 0,
  error_message    TEXT
);

CREATE INDEX IF NOT EXISTS idx_task_queue_status_priority ON task_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_task_queue_assignee_status ON task_queue(assignee, status);
CREATE INDEX IF NOT EXISTS idx_task_queue_parent ON task_queue(parent_task_id);

-- ============================================================
-- api_usage_log — OpenAI / Anthropic 等 API 用量紀錄（Phase 1 成本控管）
-- 由 Cost Guardian workflow 每小時聚合
-- ============================================================
CREATE TABLE IF NOT EXISTS api_usage_log (
  id               BIGSERIAL PRIMARY KEY,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  service          TEXT NOT NULL,           -- openai / anthropic / ollama
  model            TEXT NOT NULL,           -- gpt-4o-mini / gpt-4o / text-embedding-3-small
  workflow_id      TEXT,
  task_id          UUID REFERENCES task_queue(task_id) ON DELETE SET NULL,
  prompt_tokens    INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens     INT NOT NULL DEFAULT 0,
  cost_usd         NUMERIC(10, 6) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_api_usage_occurred ON api_usage_log(occurred_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_workflow ON api_usage_log(workflow_id, occurred_at);

-- 每日成本 view，給 Cost Guardian 與 Dashboard 用
CREATE OR REPLACE VIEW api_usage_daily AS
SELECT
  DATE(occurred_at AT TIME ZONE 'Asia/Taipei') AS usage_date,
  service,
  model,
  SUM(total_tokens) AS tokens,
  SUM(cost_usd)     AS cost_usd,
  COUNT(*)          AS call_count
FROM api_usage_log
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- ============================================================
-- workflow_errors — 全局錯誤紀錄（Phase 1 錯誤處理模板寫入）
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_errors (
  id               BIGSERIAL PRIMARY KEY,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workflow_id      TEXT NOT NULL,
  workflow_name    TEXT,
  node_name        TEXT,
  error_type       TEXT,
  error_message    TEXT,
  execution_id     TEXT,
  payload          JSONB,
  retry_count      INT NOT NULL DEFAULT 0,
  resolved_at      TIMESTAMPTZ,
  notified         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_workflow_errors_occurred ON workflow_errors(occurred_at);
CREATE INDEX IF NOT EXISTS idx_workflow_errors_unresolved ON workflow_errors(workflow_id, resolved_at) WHERE resolved_at IS NULL;
