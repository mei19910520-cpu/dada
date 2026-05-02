# CLAUDE.md

## 專案：AI研發部門終極系統

一人公司的AI自動化大腦。多Agent架構 + n8n 8引擎 + 自主學習閉環。

## 架構概述

```
docker-compose.yml    — 完整基礎設施（n8n + Qdrant + PostgreSQL + Redis + Ollama）
.env.example          — 環境變數範本
setup.sh              — 一鍵部署腳本

prompts/              — 7個AI員工系統提示詞
  00_director.md          策略總監（指揮官）
  01_automation_architect.md  自動化架構師
  02_data_intelligence.md     數據分析師
  03_conversion_strategist.md 成交策略師
  04_ux_optimizer.md          UX優化師
  05_rnd_knowledge_engine.md  知識引擎
  06_feedback_data_engineer.md 表單數據工程師

workflows/            — n8n workflow JSON（可直接匯入）
  00_Orchestrator.json          每日總指揮（07:00觸發）
  01_Knowledge_Ingestion.json   知識攝取引擎
  02_RAG_Upsert_Notion.json     Notion→Qdrant同步
  03_RAG_Upsert_Structured.json 結構化數據→Qdrant
  04_Self_Learning_Loop.json    AI自主學習閉環
  05_Long_Term_Memory_Commit.json 長期記憶管理
  06_Department_Task_Execution.json 任務派工引擎
  07_Knowledge_Book_Generator.json 週報知識書生成
  08_Google_Form_Feedback_Engine.json 表單反饋+潛客評分
  09_Daily_Briefing.json        每日執行簡報
  10_Notification_Hub.json      統一通知中樞（Telegram + LINE + Notion）
  _template_error_handler.json  全局錯誤處理模板（被各 workflow 的 errorWorkflow 設定指向）
```

## 6 個月發展藍圖

完整藍圖見 `/root/.claude/plans/inherited-chasing-scone.md`。核心五階段：

1. **M1 基礎設施加固** — 錯誤處理、LINE 整合、備份、成本守門
2. **M2–M3 AI 員工協作**（核心痛點） — Notion Tasks 任務佇列 + 7 個員工子 workflow + 3 條協作鏈
3. **M3–M4 日常營運自動化** — Next.js Dashboard + 表單成交鏈 + LINE 業主 Bot
4. **M4–M5 RAG 品質升級** — 重排序 pipeline + 知識評分 + 去重
5. **M5–M6 CI/CD 與長尾** — GitHub Actions + 表單自動優化 + 成本面板

**Phase 1 已完成的基礎設施**：
- `_template_error_handler.json`：所有 workflow 透過 `settings.errorWorkflow` 自動指向，捕捉錯誤 → 寫入 `workflow_errors` 表 → 呼叫 Notification Hub 告警。新 workflow 一律比照辦理。
- `10_Notification_Hub.json`：標準化通知入口 `POST /webhook/notification-hub`，payload `{channel: telegram|line|notion|all, level, title, message, source}`，業務層 workflow 不再直連 Telegram/LINE，一律走它。
- `config/postgres-init.sql`：新增 `task_queue`、`api_usage_log`（含 `api_usage_daily` view）、`workflow_errors` 三張表，是後續 Phase 2/3 的資料基礎。

## 快速部署

```bash
cp .env.example .env
# 填入 OPENAI_API_KEY, NOTION_API_KEY, TELEGRAM_BOT_TOKEN
./setup.sh
```

## 服務端口

- n8n UI: http://localhost:5678
- Qdrant: http://localhost:6333
- Ollama: http://localhost:11434
- Open WebUI: http://localhost:3000

## n8n Workflows 匯入順序

匯入時按編號順序，先匯入基礎設施再匯入業務 workflow：

1. `_template_error_handler.json`（必須最先，其他 workflow 的 errorWorkflow 設定指向它）
2. `10_Notification_Hub.json`（業務 workflow 與錯誤處理器都會呼叫）
3. `00_Orchestrator.json` → `09_Daily_Briefing.json`

每個 workflow 匯入後需設定 Credentials：
- OpenAI API
- Notion API
- Google Service Account
- Telegram Bot
- Qdrant API
- PostgreSQL（錯誤處理模板需要寫入 `workflow_errors` 表）

## 關鍵 Webhook 端點

所有 webhook 均相對於 `WEBHOOK_URL`：
- `/webhook/knowledge-ingestion` — 觸發知識攝取
- `/webhook/self-learning-loop` — 觸發自主學習
- `/webhook/rag-upsert-structured` — 向量化數據
- `/webhook/form-feedback-engine` — 接收表單提交
- `/webhook/department-task` — 部門任務派工
- `/webhook/daily-briefing` — 觸發日報
- `/webhook/notification-hub` — 統一通知中樞，payload `{channel, level, title, message, source}`

## 核心技術棧

- **工作流**：n8n (queue mode)
- **向量DB**：Qdrant (collections: knowledge_base, customer_data, long_term_memory, market_trends, sales_insights, form_analytics, product_knowledge, competitor_intel)
- **LLM**：OpenAI GPT-4o-mini（主力）/ GPT-4o（知識書生成）/ Ollama（本地備用）
- **Embeddings**：OpenAI text-embedding-3-small
- **知識庫**：Notion
- **結構化數據**：Google Sheets
- **通知**：Telegram Bot
- **資料庫**：PostgreSQL + Redis

## 自動化閉環流程

```
07:00 Orchestrator觸發
  ↓
知識攝取（員工1）→ 抓取市場資訊
  ↓
自主學習（員工5）→ AI分析洞察
  ↓
數據分析（員工2）→ 趨勢識別
  ↓
表單分析（員工6）→ 客戶數據優化
  ↓
08:00 Daily Briefing → Telegram通知 + Notion記錄
```
