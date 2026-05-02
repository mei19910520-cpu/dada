#!/usr/bin/env bash
# ============================================================
# AI R&D Department — 全棧備份腳本
# 備份 PostgreSQL + Qdrant snapshot + n8n workflows export
# 由 workflows/11_Backup_Engine.json 每日 03:00 觸發
# ============================================================
set -euo pipefail

# ── 路徑與設定 ──────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_BASE="${ROOT_DIR}/backups"
TODAY="$(date +%Y-%m-%d)"
BACKUP_DIR="${BACKUP_BASE}/${TODAY}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
REMOTE="${BACKUP_REMOTE:-none}"

# 載入 .env（若存在）
if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -o allexport
  # shellcheck disable=SC1090,SC1091
  source "${ROOT_DIR}/.env"
  set +o allexport
fi

mkdir -p "${BACKUP_DIR}"

log() { echo "[backup $(date +%H:%M:%S)] $*"; }

# ── 1. PostgreSQL ──────────────────────────────────────────
log "備份 PostgreSQL → ${BACKUP_DIR}/postgres.sql.gz"
docker exec postgres_n8n pg_dump \
  -U "${POSTGRES_USER:-n8n}" \
  -d "${POSTGRES_DB:-n8n}" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip -9 > "${BACKUP_DIR}/postgres.sql.gz"

# ── 2. Qdrant snapshot ─────────────────────────────────────
log "建立 Qdrant snapshot"
QDRANT_API_KEY_HEADER=()
if [[ -n "${QDRANT_API_KEY:-}" ]]; then
  QDRANT_API_KEY_HEADER=(-H "api-key: ${QDRANT_API_KEY}")
fi

# 對所有 collection 建 snapshot 並下載
COLLECTIONS=$(curl -fsS "${QDRANT_API_KEY_HEADER[@]}" \
  "http://localhost:6333/collections" \
  | sed 's/.*"collections":\[\(.*\)\].*/\1/' \
  | grep -oE '"name":"[^"]+"' | sed 's/"name":"\(.*\)"/\1/' || true)

mkdir -p "${BACKUP_DIR}/qdrant"
for col in ${COLLECTIONS}; do
  log "  └ snapshot collection: ${col}"
  SNAP_NAME=$(curl -fsS -X POST "${QDRANT_API_KEY_HEADER[@]}" \
    "http://localhost:6333/collections/${col}/snapshots" \
    | grep -oE '"name":"[^"]+"' | head -1 | sed 's/"name":"\(.*\)"/\1/')
  if [[ -n "${SNAP_NAME}" ]]; then
    curl -fsS "${QDRANT_API_KEY_HEADER[@]}" \
      "http://localhost:6333/collections/${col}/snapshots/${SNAP_NAME}" \
      -o "${BACKUP_DIR}/qdrant/${col}__${SNAP_NAME}"
  fi
done

# ── 3. n8n workflows JSON 匯出（從 PostgreSQL 直接撈）─────
log "匯出 n8n workflows"
docker exec postgres_n8n psql \
  -U "${POSTGRES_USER:-n8n}" -d "${POSTGRES_DB:-n8n}" -At -c \
  "SELECT json_build_object('id', id, 'name', name, 'active', active, 'nodes', nodes, 'connections', connections, 'settings', settings) FROM workflow_entity;" \
  > "${BACKUP_DIR}/n8n_workflows.jsonl" || true

# ── 4. 元資料 ───────────────────────────────────────────────
cat > "${BACKUP_DIR}/manifest.json" <<EOF
{
  "date": "${TODAY}",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "postgres_db": "${POSTGRES_DB:-n8n}",
  "qdrant_collections": "${COLLECTIONS}",
  "size_bytes": $(du -sb "${BACKUP_DIR}" | cut -f1)
}
EOF

# ── 5. 遠端上傳（可選）─────────────────────────────────────
case "${REMOTE}" in
  s3)
    log "上傳到 S3：${BACKUP_S3_BUCKET}"
    aws s3 sync "${BACKUP_DIR}" "s3://${BACKUP_S3_BUCKET}/${TODAY}/" --quiet
    ;;
  gdrive)
    log "上傳到 Google Drive (需另外設定 rclone remote: gdrive)"
    rclone copy "${BACKUP_DIR}" "gdrive:ai-rnd-backups/${TODAY}/" --quiet
    ;;
  none|*)
    log "未設定遠端備份 (BACKUP_REMOTE=${REMOTE})"
    ;;
esac

# ── 6. 清理過期備份 ────────────────────────────────────────
log "清理 ${RETENTION_DAYS} 天前的備份"
find "${BACKUP_BASE}" -mindepth 1 -maxdepth 1 -type d \
  -mtime "+${RETENTION_DAYS}" -exec rm -rf {} +

log "備份完成 → ${BACKUP_DIR} ($(du -sh "${BACKUP_DIR}" | cut -f1))"
echo "{\"status\":\"success\",\"path\":\"${BACKUP_DIR}\",\"date\":\"${TODAY}\"}"
