#!/usr/bin/env bash
# ============================================================
# AI R&D Department — 還原腳本
# 用法：./scripts/restore.sh 2026-05-01
# ============================================================
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "用法：$0 YYYY-MM-DD [--postgres-only|--qdrant-only]" >&2
  exit 1
fi

DATE="$1"
MODE="${2:-all}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups/${DATE}"

if [[ ! -d "${BACKUP_DIR}" ]]; then
  echo "❌ 找不到備份：${BACKUP_DIR}" >&2
  exit 1
fi

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -o allexport
  # shellcheck disable=SC1090,SC1091
  source "${ROOT_DIR}/.env"
  set +o allexport
fi

log() { echo "[restore $(date +%H:%M:%S)] $*"; }

confirm() {
  read -r -p "⚠️  這會覆寫現有資料，確定要還原 ${DATE} 的備份嗎？ [yes/N] " ans
  [[ "${ans}" == "yes" ]] || { echo "取消"; exit 1; }
}

confirm

# ── PostgreSQL 還原 ────────────────────────────────────────
if [[ "${MODE}" != "--qdrant-only" ]]; then
  log "還原 PostgreSQL..."
  gunzip -c "${BACKUP_DIR}/postgres.sql.gz" \
    | docker exec -i postgres_n8n psql \
        -U "${POSTGRES_USER:-n8n}" -d "${POSTGRES_DB:-n8n}"
fi

# ── Qdrant 還原 ────────────────────────────────────────────
if [[ "${MODE}" != "--postgres-only" ]]; then
  log "還原 Qdrant snapshots..."
  QDRANT_API_KEY_HEADER=()
  if [[ -n "${QDRANT_API_KEY:-}" ]]; then
    QDRANT_API_KEY_HEADER=(-H "api-key: ${QDRANT_API_KEY}")
  fi

  for snap in "${BACKUP_DIR}/qdrant/"*; do
    [[ -f "${snap}" ]] || continue
    fname=$(basename "${snap}")
    col="${fname%%__*}"
    log "  └ 還原 collection: ${col}"
    curl -fsS -X PUT "${QDRANT_API_KEY_HEADER[@]}" \
      "http://localhost:6333/collections/${col}/snapshots/upload?priority=snapshot" \
      -F "snapshot=@${snap}" > /dev/null
  done
fi

log "還原完成。建議重啟 n8n：docker restart n8n_main n8n_worker"
