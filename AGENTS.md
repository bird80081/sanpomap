# 給 AI 助手（Claude Code / Codex）的維護規則

> **這份是唯一規則來源。** Codex 直接讀本檔；Claude Code 讀 `CLAUDE.md`，那份只有一行把本檔匯入。
> 要改規則請改這裡，**不要**在 `CLAUDE.md` 另外寫內容，否則兩邊規則會分岔。

先讀 `README.md` 了解架構。

## 專案位置
- 網址：https://bird80081.github.io/sanpomap/
- GitHub：`bird80081/sanpomap`（公開）；本機：`~/Projects/sanpomap/`
- `main` 分支 push 後約 1 分鐘，GitHub Pages 自動更新上線。

## 程式規則
- 保持純 HTML/CSS/JS，不要引入框架、打包工具或 npm 相依，除非使用者要求。
- 行程內容只改 `data.js`；邏輯改 `app.js`；顏色與字重改 `theme.css`，版面結構改 `style.css`。
- 所有使用者輸入顯示前都要經過 `esc()`，避免 XSS。
- 不要改變 Firebase 資料路徑 `/{TRIP.id}/extra/{day}/{id}` 的格式，否則雲端現有資料會讀不到；如需遷移請寫遷移步驟。
- 視覺風格（2026-09-28 改版）：粉藍＋粉黃為主、鼠尾草綠點綴（依茶兒的兩張 moodboard 混搭）；標題用 Noto Serif TC、內文 Nunito + Noto Sans TC；按鈕是淡色膠囊配深色字；手機優先（max-width 600px）。
- **顏色與字重一律改 `theme.css`**（載入在 `style.css` 之後，所有色票是 `:root` 變數）；`style.css` 是版面結構與舊樣式，盡量不要在裡面加新顏色。粉色只當底色，文字與圖示用深色，對比要 ≥ 4.5:1。
- 圖示是 `index.html` 內的 `<symbol id="i-xxx">` 線條圖（依 CNS 16282 改繪），新增圖示照同樣線寬 2、圓角畫法；封面主圖在 `data.js` 的 `cover.url`／`cover.credit`。
- 介面文字使用繁體中文（台灣用語）。

## 工作流程
1. **改之前**：`git pull`，另一方（Claude／Codex）可能剛推過。
2. **改完**：在本機預覽（`python3 -m http.server`，直接開 `file://` 時 JS 不一定會跑），用手機寬度 375px 檢查版面、三天分頁都點過。
3. **commit**：訊息用繁體中文寫「改了什麼」。
4. **push＝上線**：使用者說「改完 push」或「上線」才 push；沒說就先給預覽，問要不要上線。
5. **push 後**：打開正式網址確認已更新。
