# 給 AI 助手（Claude Code / Codex）的維護規則

先讀 `README.md` 了解架構。

- 保持純 HTML/CSS/JS，不要引入框架、打包工具或 npm 相依，除非使用者要求。
- 行程內容只改 `data.js`；邏輯改 `app.js`；樣式改 `style.css`（優先用 `:root` 變數）。
- 所有使用者輸入顯示前都要經過 `esc()`，避免 XSS。
- 不要改變 Firebase 資料路徑 `/{TRIP.id}/extra/{day}/{id}` 的格式，否則雲端現有資料會讀不到；如需遷移請寫遷移步驟。
- 視覺風格：奶茶色系、圓角大卡片、虛線膠囊按鈕、手機優先（max-width 600px）。字型 Nunito + Noto Sans TC。
- 介面文字使用繁體中文（台灣用語）。
- 改完請在手機寬度（375px）檢查版面。
