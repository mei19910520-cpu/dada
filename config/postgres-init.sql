-- AI R&D Department — PostgreSQL 初始化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- n8n 執行記錄分析視圖（選用）
-- 讓你可以查詢 workflow 執行統計
