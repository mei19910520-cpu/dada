#!/bin/bash
# ============================================================
# AI R&D Department — 一鍵部署腳本
# 使用方式: chmod +x setup.sh && ./setup.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

echo -e "${CYAN}"
cat << 'EOF'
 ╔═══════════════════════════════════════════╗
 ║   AI R&D Department — Ultimate System    ║
 ║   多Agent + n8n 8引擎 + 自主學習閉環      ║
 ╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ─── 1. 前置檢查 ─────────────────────────────────────────
log_step "前置環境檢查"

check_command() {
    if command -v "$1" &>/dev/null; then
        log_ok "$1 已安裝 ($(command -v "$1"))"
    else
        log_error "$1 未安裝，請先安裝後再執行"
        exit 1
    fi
}

check_command docker
check_command docker-compose 2>/dev/null || check_command "docker compose"
check_command curl
check_command openssl

# ─── 2. 環境變數設定 ──────────────────────────────────────
log_step "環境變數設定"

if [ ! -f ".env" ]; then
    cp .env.example .env
    log_warn ".env 不存在，已從 .env.example 複製"
    log_warn "請編輯 .env 填入你的 API Keys 後再繼續"

    # 自動生成安全金鑰
    N8N_KEY=$(openssl rand -hex 24)
    POSTGRES_PASS=$(openssl rand -hex 16)
    REDIS_PASS=$(openssl rand -hex 16)
    QDRANT_KEY=$(openssl rand -hex 16)
    WEBUI_SECRET=$(openssl rand -hex 16)

    sed -i "s/your-32-char-encryption-key-here-change-me/${N8N_KEY}/" .env
    sed -i "s/your-strong-postgres-password-here/${POSTGRES_PASS}/" .env
    sed -i "s/your-strong-redis-password-here/${REDIS_PASS}/" .env
    sed -i "s/your-qdrant-api-key-here/${QDRANT_KEY}/" .env
    sed -i "s/your-open-webui-secret-key/${WEBUI_SECRET}/" .env

    log_ok "安全金鑰已自動生成並寫入 .env"
    echo ""
    echo "  請填入以下必要的 API Keys:"
    echo "  - OPENAI_API_KEY"
    echo "  - ANTHROPIC_API_KEY (可選)"
    echo "  - NOTION_API_KEY"
    echo "  - TELEGRAM_BOT_TOKEN (通知用)"
    echo ""
    read -p "  已設定完成？繼續部署？ (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "請設定完 .env 後重新執行 ./setup.sh"
        exit 0
    fi
else
    log_ok ".env 已存在"
fi

source .env

# ─── 3. 建立設定檔案 ──────────────────────────────────────
log_step "建立設定檔案"

mkdir -p config/ssl

# PostgreSQL 初始化 SQL
cat > config/postgres-init.sql << 'SQLEOF'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
SQLEOF
log_ok "PostgreSQL 初始化 SQL 建立完成"

# Nginx 設定 (開發版本)
cat > config/nginx.conf << NGINXEOF
events {
    worker_connections 1024;
}

http {
    upstream n8n {
        server n8n:5678;
    }

    server {
        listen 80;
        server_name ${N8N_HOST:-localhost};

        location / {
            proxy_pass http://n8n;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 3600;
        }
    }
}
NGINXEOF
log_ok "Nginx 設定建立完成"

# ─── 4. 啟動服務 ──────────────────────────────────────────
log_step "啟動 Docker 服務"

docker compose pull
log_ok "映像檔拉取完成"

docker compose up -d postgres redis
log_info "等待資料庫啟動..."
sleep 15

docker compose up -d qdrant ollama
log_info "等待向量資料庫和 LLM 引擎啟動..."
sleep 10

docker compose up -d n8n n8n_worker open_webui
log_info "等待 n8n 啟動..."
sleep 20

# ─── 5. 初始化 Ollama 模型 ────────────────────────────────
log_step "下載 Ollama 本地模型"

DEFAULT_MODEL="${OLLAMA_DEFAULT_MODEL:-llama3.2:3b}"
log_info "下載模型: ${DEFAULT_MODEL}"
docker exec ollama_llm ollama pull "${DEFAULT_MODEL}" || log_warn "模型下載失敗，請手動執行: docker exec ollama_llm ollama pull ${DEFAULT_MODEL}"

# 下載 embedding 模型
log_info "下載 Embedding 模型: nomic-embed-text"
docker exec ollama_llm ollama pull nomic-embed-text || log_warn "Embedding 模型下載失敗"

# ─── 6. 初始化 Qdrant Collections ─────────────────────────
log_step "初始化 Qdrant 向量資料庫"

QDRANT_BASE="http://localhost:6333"

create_collection() {
    local name=$1
    local size=${2:-1536}
    curl -sf -X PUT "${QDRANT_BASE}/collections/${name}" \
        -H "Content-Type: application/json" \
        -H "api-key: ${QDRANT_API_KEY}" \
        -d "{
            \"vectors\": {
                \"size\": ${size},
                \"distance\": \"Cosine\"
            },
            \"optimizers_config\": {
                \"default_segment_number\": 2
            },
            \"replication_factor\": 1
        }" > /dev/null && log_ok "Collection 建立: ${name}" || log_warn "Collection 可能已存在: ${name}"
}

create_collection "knowledge_base" 1536
create_collection "market_trends" 1536
create_collection "customer_data" 1536
create_collection "long_term_memory" 1536
create_collection "form_analytics" 1536
create_collection "sales_insights" 1536
create_collection "product_knowledge" 1536
create_collection "competitor_intel" 1536

# ─── 7. 健康檢查 ──────────────────────────────────────────
log_step "服務健康檢查"

check_service() {
    local name=$1
    local url=$2
    if curl -sf "$url" > /dev/null 2>&1; then
        log_ok "$name 運行正常"
    else
        log_warn "$name 可能尚未就緒，請稍後再確認"
    fi
}

sleep 10
check_service "n8n UI"      "http://localhost:5678/healthz"
check_service "Qdrant"      "http://localhost:6333/dashboard"
check_service "Ollama"      "http://localhost:11434/api/tags"
check_service "Open WebUI"  "http://localhost:3000"

# ─── 8. 匯入 n8n Workflows ────────────────────────────────
log_step "準備 n8n Workflows 匯入"

log_info "Workflows 位於 ./workflows/ 目錄"
log_info "請手動匯入流程："
echo ""
echo "  方法1 (推薦):"
echo "  1. 開啟 http://localhost:5678"
echo "  2. Settings → Import workflow"
echo "  3. 依序匯入 workflows/ 目錄下所有 .json 檔案"
echo ""
echo "  方法2 (CLI):"
echo "  docker exec -it n8n_main n8n import:workflow --input=/workflows/"
echo ""

# 複製 workflows 到容器
docker cp workflows/. n8n_main:/home/node/.n8n/workflows/ 2>/dev/null && \
    log_ok "Workflows 已複製到容器" || \
    log_warn "請手動匯入 workflows/"

# ─── 9. 完成 ─────────────────────────────────────────────
log_step "部署完成"

echo -e "${GREEN}"
cat << EOF
 ╔═══════════════════════════════════════════════════════╗
 ║              AI R&D 部門啟動成功！                     ║
 ╠═══════════════════════════════════════════════════════╣
 ║  n8n 工作流引擎    http://localhost:5678              ║
 ║  Open WebUI        http://localhost:3000              ║
 ║  Qdrant Dashboard  http://localhost:6333/dashboard    ║
 ║  Ollama API        http://localhost:11434             ║
 ╠═══════════════════════════════════════════════════════╣
 ║  下一步：                                              ║
 ║  1. 登入 n8n → 匯入 workflows/*.json                  ║
 ║  2. 設定各 workflow 的 Credentials                    ║
 ║  3. 啟動 [00] Orchestrator workflow                   ║
 ║  4. 確認 Daily Briefing 每日通知正常                   ║
 ╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
