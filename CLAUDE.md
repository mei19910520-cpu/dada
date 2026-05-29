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

workflows/            — 10個n8n workflow JSON（可直接匯入）
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
```

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

匯入時按編號順序：00 → 09

每個 workflow 匯入後需設定 Credentials：
- OpenAI API
- Notion API
- Google Service Account
- Telegram Bot
- Qdrant API

## 關鍵 Webhook 端點

所有 webhook 均相對於 `WEBHOOK_URL`：
- `/webhook/knowledge-ingestion` — 觸發知識攝取
- `/webhook/self-learning-loop` — 觸發自主學習
- `/webhook/rag-upsert-structured` — 向量化數據
- `/webhook/form-feedback-engine` — 接收表單提交
- `/webhook/department-task` — 部門任務派工
- `/webhook/daily-briefing` — 觸發日報

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

## 行銷部門擴充（2026-04）

新增一套可直接落地的 AI 行銷部門模組：

- 文件：`MARKETING_DEPARTMENT.md`
- Prompts：`prompts/10~15_*.md`
- Workflows：`workflows/10~15_*.json`

建議先匯入 `10_Monthly_Marketing_Brain`，再依序匯入 `11~15`。
