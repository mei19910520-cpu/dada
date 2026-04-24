# MAUYUAN 網站部署與 Google 後端串接

## 1) 建立 Google Apps Script 後端
1. 開啟 https://script.google.com/ 建立新專案。
2. 貼上以下程式（可直接寫入 Google Sheet）：

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID').getSheetByName('queue');
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.phone || '',
    data.lineId || '',
    data.preference || '',
    data.note || '',
    data.source || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. `Deploy` → `New deployment` → `Web app`。
4. `Who has access` 選 `Anyone`（或你的授權範圍）。
5. 複製 Web App URL。

## 2) 設定前端端點
修改 `website/config.js`：

```javascript
window.MAUYUAN_CONFIG = {
  googleEndpoint: '你的 Google Apps Script Web App URL'
};
```

## 3) 本機預覽
```bash
python3 -m http.server 8000 --directory website
```
打開 `http://localhost:8000`。

## 4) 部署到公開網址（建議 Firebase Hosting）
```bash
npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```
部署完成後會得到 `https://<project-id>.web.app` 網址。
