# CLAUDE.md

## 專案：AI研發部門終極系統

一人公司的AI自動化大腦。多Agent架構 + n8n引擎 + 自主學習閉環 + 行銷部門模組。

**狀態**：生產環境完整部署版本（v1.0 + Marketing v1.1）

---

## 目錄結構

```
.
├── CLAUDE.md                          此檔案（開發指南）
├── MARKETING_DEPARTMENT.md            行銷部門模組文件
├── docker-compose.yml                 完整基礎設施定義
├── .env.example                       環境變數範本
├── setup.sh                           一鍵部署腳本
│
├── config/
│   └── postgres-init.sql              PostgreSQL初始化SQL
│
├── prompts/                           13個AI角色系統提示詞
│   ├── [核心部門] 00-06
│   │   ├── 00_director.md             策略總監（全局指揮）
│   │   ├── 01_automation_architect.md 自動化架構師
│   │   ├── 02_data_intelligence.md    數據分析師
│   │   ├── 03_conversion_strategist.md 成交策略師
│   │   ├── 04_ux_optimizer.md         UX優化師
│   │   ├── 05_rnd_knowledge_engine.md 知識引擎
│   │   └── 06_feedback_data_engineer.md 表單數據工程師
│   │
│   └── [行銷部門] 10-15
│       ├── 10_marketing_director.md   行銷經理（月度策略）
│       ├── 11_content_generator.md    內容生成AI
│       ├── 12_creative_visual.md      創意視覺AI
│       ├── 13_growth_analyst.md       成長分析AI
│       ├── 14_competitor_intel.md     競品分析AI
│       └── 15_seo_ads_specialist.md   SEO & 廣告AI
│
├── workflows/                         16個n8n工作流JSON
│   ├── [核心系統] 00-09
│   │   ├── 00_Orchestrator.json       每日總指揮（07:00觸發）
│   │   ├── 01_Knowledge_Ingestion.json    知識攝取引擎
│   │   ├── 02_RAG_Upsert_Notion.json     Notion→Qdrant同步
│   │   ├── 03_RAG_Upsert_Structured.json 結構化數據→Qdrant
│   │   ├── 04_Self_Learning_Loop.json    AI自主學習閉環
│   │   ├── 05_Long_Term_Memory_Commit.json 長期記憶管理
│   │   ├── 06_Department_Task_Execution.json 任務派工引擎
│   │   ├── 07_Knowledge_Book_Generator.json 週報知識書生成
│   │   ├── 08_Google_Form_Feedback_Engine.json 表單反饋評分
│   │   └── 09_Daily_Briefing.json    每日執行簡報
│   │
│   └── [行銷部門] 10-15
│       ├── 10_Monthly_Marketing_Brain.json 月度策略規劃
│       ├── 11_Content_Generator.json       日內容生成
│       ├── 12_Creative_Visual_Studio.json  圖文短影音腳本
│       ├── 13_Growth_Analyst_Daily.json    成效分析與優化
│       ├── 14_Competitor_Intelligence_Daily.json 競品監控
│       └── 15_SEO_Ads_Weekly.json      SEO與廣告優化
│
└── website/                          前端資源（可選）
    └── DEPLOY_GOOGLE.md              Google部署指南
```

---

## 核心技術棧

| 組件 | 技術選擇 | 說明 |
|------|---------|------|
| **編排引擎** | n8n (queue mode) | 分散式任務隊列，支援複雜工作流 |
| **向量資料庫** | Qdrant | 多collection結構化知識存儲 |
| **LLM** | OpenAI GPT-4o-mini / GPT-4o | 主力模型；Ollama本地備用 |
| **Embeddings** | OpenAI text-embedding-3-small | 向量化模型 |
| **知識庫** | Notion | 文檔管理與RAG來源 |
| **結構化數據** | Google Sheets / Airtable | 營銷績效、競品數據 |
| **消息通知** | Telegram Bot | 日報與警報推送 |
| **資料庫** | PostgreSQL | n8n元數據 + 業務數據 |
| **快取隊列** | Redis | 工作流隊列系統 |
| **本地LLM** | Ollama | 成本控制備選方案 |

---

## Qdrant Collections（知識架構）

```
knowledge_base              核心知識庫（RAG基礎）
customer_data              客戶交互數據
long_term_memory           AI長期記憶
market_trends              市場趨勢觀測
sales_insights             銷售洞察
form_analytics             表單反饋分析
product_knowledge          產品知識庫
competitor_intel           競品情報
marketing_content          行銷內容資料庫（v1.1+）
```

---

## 快速部署

### 前置要求

- Docker + Docker Compose
- 環境變數設置（見下文）

### 部署步驟

```bash
# 1. 複製環境變數模板
cp .env.example .env

# 2. 編輯.env，填入必要密鑰
# 必需：
#   - OPENAI_API_KEY
#   - NOTION_API_KEY
#   - N8N_ENCRYPTION_KEY（運行 openssl rand -base64 32 生成）
#   - POSTGRES_PASSWORD
#   - REDIS_PASSWORD

# 3. 賦予執行權限並運行一鍵部署
chmod +x setup.sh
./setup.sh
```

### 服務端口

- **n8n UI & Webhooks**：http://localhost:5678
- **Qdrant API**：http://localhost:6333
- **PostgreSQL**：localhost:5432
- **Redis**：localhost:6379
- **Ollama**：http://localhost:11434
- **Open WebUI**：http://localhost:3000

---

## n8n Workflows 匯入指南

### 匯入順序

**核心系統**：00 → 09 依序匯入  
**行銷部門**：10 → 15 依序匯入

### 配置凭证

匯入每個workflow後，需在n8n中設定以下Credentials（需配置一次，後續workflow共用）：

- **OpenAI API** — API金鑰認證
- **Notion API** — 資料庫與頁面存取權
- **Google Service Account** — 表單與Sheets接觸
- **Qdrant Vector Store** — 本地或雲端連接
- **Telegram Bot** — Token與Chat ID（可選）

### Webhook端點映射

所有endpoint相對於 `WEBHOOK_URL` 環境變數：

```
/webhook/knowledge-ingestion         觸發知識攝取 (workflow 01)
/webhook/rag-upsert-notion          Notion同步 (workflow 02)
/webhook/rag-upsert-structured      結構化數據向量化 (workflow 03)
/webhook/self-learning-loop         AI自主學習 (workflow 04)
/webhook/form-feedback-engine       表單處理 (workflow 08)
/webhook/department-task            任務派工 (workflow 06)
/webhook/daily-briefing             日報觸發 (workflow 09)
/webhook/marketing-monthly          行銷月規劃 (workflow 10)
/webhook/marketing-content          內容生成 (workflow 11)
/webhook/marketing-visual           視覺創意 (workflow 12)
/webhook/marketing-growth-daily     成長分析 (workflow 13)
/webhook/marketing-competitor       競品監控 (workflow 14)
/webhook/marketing-seo-weekly       SEO每週 (workflow 15)
```

---

## 自動化流程設計

### 核心系統日常流程

```
07:00 n8n Scheduler 觸發
  │
  ├─→ Workflow 00: Orchestrator (總指揮)
  │     │
  │     ├─→ Workflow 01: Knowledge Ingestion
  │     │     抓取市場信息 → Qdrant 入庫
  │     │
  │     ├─→ Workflow 04: Self Learning Loop
  │     │     AI 分析洞察 → 生成見解
  │     │
  │     ├─→ Workflow 02: RAG Upsert Notion
  │     │     同步 Notion 文檔 → 向量化
  │     │
  │     └─→ Workflow 03: RAG Upsert Structured
  │           Google Sheets 數據 → Qdrant
  │
  └─→ 08:00 Workflow 09: Daily Briefing
        執行簡報 → Telegram 推送 → Notion 記錄
```

### 行銷部門自動化（v1.1+）

```
每月 1 號 00:00
  ↓
Workflow 10: Monthly Marketing Brain
  (策略規劃、內容角度設計)
  ↓
每日 08:00
  ├─→ Workflow 11: Content Generator (多平台內容)
  ├─→ Workflow 12: Creative Visual (圖文腳本)
  ├─→ Workflow 13: Growth Analyst (績效分析)
  └─→ Workflow 14: Competitor Intelligence (競品監控)

每週一 09:00
  ↓
Workflow 15: SEO & Ads Weekly (優化建議)
```

---

## 環境變數配置（.env）

### 必需變數

```bash
# OpenAI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # 可選

# Notion
NOTION_API_KEY=noti_...
NOTION_CONTENT_DB_ID=...      # 核心知識庫
NOTION_CUSTOMER_DB_ID=...     # 客戶信息

# 行銷部門專用（可選，如啟用workflow 10-15）
NOTION_MARKETING_TOPICS_DB_ID=...
NOTION_CONTENT_QUEUE_DB_ID=...
NOTION_MARKETING_REPORT_DB_ID=...

# n8n
N8N_ENCRYPTION_KEY=...        # openssl rand -base64 32
N8N_HOST=localhost
WEBHOOK_URL=http://localhost:5678

# PostgreSQL
POSTGRES_USER=n8n
POSTGRES_PASSWORD=...
POSTGRES_DB=n8n

# Redis
REDIS_PASSWORD=...

# Telegram（可選）
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# 時區
TIMEZONE=Asia/Taipei
```

---

## 開發工作流

### 添加新的 Prompt（AI角色）

1. 在 `prompts/` 新建檔案：`NN_role_name.md`
2. 撰寫系統提示詞，遵循現有格式
3. 若需綁定workflow，在workflow配置中引用prompt內容
4. 提交並通知n8n團隊更新配置

### 添加新的 Workflow

1. 在 n8n UI 中設計工作流
2. 導出為 JSON 並保存至 `workflows/NN_Workflow_Name.json`
3. 更新 CLAUDE.md 文件樹
4. 測試所有依賴的Credentials
5. 提交並記錄webhook端點（如有）

### 修改Qdrant Collections

1. 編輯 `config/postgres-init.sql` 或通過 Qdrant API
2. 測試新collection的向量化和查詢
3. 更新上方Collections列表
4. 重啟相關workflow進行驗證

---

## 常見問題 & 最佳實踐

### 成本優化

- **預設模型**：GPT-4o-mini（成本最低，質量可控）
- **升級場景**：知識書生成、高價值決策 → 改用 GPT-4o
- **本地備選**：成本極限 → 使用 Ollama
- **監控**：每週檢查 OpenAI Usage Dashboard

### 性能最佳化

- **批量操作**：向量化大量文檔時使用 batch API
- **快取策略**：RAG查詢結果存入 Redis 24小時
- **隊列管理**：Redis queue mode 確保無損失
- **數據清理**：Qdrant collection定期 compact

### 安全性

- `N8N_ENCRYPTION_KEY` 務必存放於密鑰管理系統（非.env）
- Notion、Google Service Account 金鑰定期輪換
- PostgreSQL 密碼強度 >= 16 字符
- Webhook 端點限制來源IP或JWT驗證

---

## 監控 & 日誌

### n8n Metrics

n8n UI 內建 metrics 頁面（http://localhost:5678/metrics）：
- Workflow執行次數
- 平均執行時間
- 失敗率

### 系統日誌

```bash
# 查看n8n主節點日誌
docker-compose logs n8n-main

# 查看workers日誌
docker-compose logs n8n-worker-1

# 查看Qdrant日誌
docker-compose logs qdrant

# 查看PostgreSQL日誌
docker-compose logs postgres
```

### 告警設置

在 Telegram 通知中配置告警：
- Workflow 失敗 3 次以上 → 發送警報
- 平均執行時間超過閾值 → 性能警報
- Qdrant 連接失敗 → 系統告警

---

## 版本歷史

| 版本 | 發佈日期 | 核心內容 |
|------|---------|---------|
| v1.0 | 2026-02 | 核心R&D系統（7個角色 + 10個工作流） |
| v1.1 | 2026-04 | 行銷部門模組（6個行銷角色 + 6個工作流） |

---

## 進階配置

詳見：
- **行銷部門詳細配置**：[MARKETING_DEPARTMENT.md](./MARKETING_DEPARTMENT.md)
- **Google 部署**：[website/DEPLOY_GOOGLE.md](./website/DEPLOY_GOOGLE.md)

---

## 聯繫 & 反饋

問題報告或功能建議：提交至代碼倉庫 Issues 區
