# AI 行銷部門（可落地版）

這份配置把你提出的「1 位 AI 行銷經理 + 5 位 AI 員工」落地為可直接匯入 n8n 的工作流與提示詞。

## 部門角色

- `Marketing Director AI`：月度策略與任務分配
- `Content Generator AI`：多平台內容批量生成
- `Creative Visual AI`：圖片/短影音腳本生產
- `Growth Analyst AI`：每日成效分析與優化建議
- `Competitor Intelligence AI`：競品監控與策略拆解
- `SEO & Ads AI Specialist`：SEO 與廣告素材生產

## 匯入檔案

### Prompts

- `prompts/10_marketing_director.md`
- `prompts/11_content_generator.md`
- `prompts/12_creative_visual.md`
- `prompts/13_growth_analyst.md`
- `prompts/14_competitor_intel.md`
- `prompts/15_seo_ads_specialist.md`

### Workflows（依序匯入）

- `workflows/10_Monthly_Marketing_Brain.json`
- `workflows/11_Content_Generator.json`
- `workflows/12_Creative_Visual_Studio.json`
- `workflows/13_Growth_Analyst_Daily.json`
- `workflows/14_Competitor_Intelligence_Daily.json`
- `workflows/15_SEO_Ads_Weekly.json`

## 建議資料表（Notion / Airtable）

至少準備這些 table：

1. `marketing_topics`
   - `month` (text)
   - `theme` (text)
   - `content_angle` (long text)
   - `priority` (select)
2. `content_queue`
   - `platform` (select)
   - `title` (text)
   - `content` (long text)
   - `cta` (text)
   - `hashtags` (long text)
   - `image_prompt` (long text)
   - `status` (select)
3. `performance_daily`
   - `date` (date)
   - `platform` (select)
   - `impressions` (number)
   - `engagement_rate` (number)
   - `ctr` (number)
   - `conversion_rate` (number)
4. `competitor_feed`
   - `competitor` (text)
   - `channel` (select)
   - `content` (long text)
   - `cta_type` (select)
   - `notes` (long text)

## 必要環境變數

- `OPENAI_API_KEY`
- `NOTION_API_KEY`
- `NOTION_MARKETING_TOPICS_DB_ID`
- `NOTION_CONTENT_QUEUE_DB_ID`
- `NOTION_MARKETING_REPORT_DB_ID`
- `TELEGRAM_BOT_TOKEN`（可選）
- `TELEGRAM_CHAT_ID`（可選）

## 觸發節奏

- 每月 1 號：`Monthly Marketing Brain`
- 每天：`Content Generator` / `Creative Visual` / `Growth Analyst` / `Competitor Intelligence`
- 每週：`SEO & Ads`

## 實務建議

- 先以 `gpt-4o-mini` 跑全流程，確保成本可控。
- 表現最佳內容可升級至 `gpt-4o` 做二次精修。
- 建立「停發規則」：連續 7 天低於基準表現的內容角度自動下架。

## 自主社群帝國 Skill（2026-06）

在行銷部門之上，新增一套「全自動社群帝國」Agent Skill，串接 FB / IG / X /
TikTok / LinkedIn 的研究→生成→排程→發佈→互動→分析→自我迭代閉環：

- Skill：`.claude/skills/social-media-empire/`（`SKILL.md` + `references/` + `assets/`）
- Workflow：`workflows/16_Social_Empire_Orchestrator.json`（請於 `10~15` 之後匯入）
- 內含護欄（guardrails）、評估指標（eval metrics）、品牌一致性系統與每日單一人工審核閘門。

當需要「建立／調整／除錯自動社群流程」時，Claude 會自動載入此 Skill。
