# 高屏・南迴・花蓮 3日懶人包

手機優先的行程網頁：三天行程、新增行程（Firebase 即時同步）、Google Maps 導航、交通與住宿資訊。
純 HTML／CSS／JavaScript，不需要安裝或編譯，可直接放上 GitHub Pages。

## 檔案
| 檔案 | 用途 |
|---|---|
| `index.html` | 版面骨架（各區塊的容器） |
| `data.js` | **所有行程內容**：每日景點、交通表、住宿、Firebase 網址、類型與用餐時段 |
| `app.js` | 畫面渲染、Day 切換、新增／刪除行程、Firebase 同步、Google Maps 連結、用餐提醒 |
| `style.css` | 樣式（顏色變數在 `:root`） |

## 本機預覽
直接用瀏覽器打開 `index.html`，或在資料夾執行 `npx serve .`。

## 發佈到 GitHub Pages
1. 把這個資料夾的所有檔案放到 repository 根目錄。
2. Settings → Pages → Branch 選 `main`、資料夾 `/ (root)` → Save。
3. 網址：`https://<帳號>.github.io/<repo>/`

## 功能說明
- **固定行程**：寫在 `data.js` 的 `TRIP.days[n].spots`。欄位：`time`、`title`、`tag`、`icon`、`type`、`desc`、`q`（Google Maps 搜尋字）。
- **新增行程**：使用者在網頁上新增，存到 Firebase `/{TRIP.id}/extra/{day}/{id}`，依 `time` 中第一個 `HH:MM` 自動排序；時間無法解析的排最後。
- **即時同步**：使用 Firebase Realtime Database 的 REST API + `EventSource` 串流，不需要 Firebase SDK 或 apiKey。`TRIP.dbUrl` 留空則改存 localStorage（僅本機）。
- **用餐提醒**：`MEALS` 定義早／午／晚餐時段；若當天行程涵蓋該時段、但沒有 `type: "food"` 的項目，就顯示「還沒安排」。
- **Google Maps 整日路線**：`/maps/dir/?api=1`，起點＝當天第一站、終點＝最後一站、中途點最多 9 個（Google 限制）。`travelmode` 由每日的 `travelmode` 設定。

## Firebase
- 資料庫：`https://taiwan-trival-default-rtdb.firebaseio.com`
- 資料結構：
  ```json
  { "trip-gp-hl": { "extra": { "1": { "1790000000000": { "id": 1790000000000, "time": "12:30", "title": "…", "desc": "…", "type": "food", "tags": ["必吃"] } } } } }
  ```
- 測試模式約 30 天後到期，請到 Realtime Database → 規則，貼上：
  ```json
  { "rules": { "trip-gp-hl": { ".read": true, ".write": true } } }
  ```
- 注意：目前任何知道網址的人都能新增／刪除。若要公開分享，建議加上 Firebase Authentication 或簡單密碼。

## 後續可做
- 讓固定行程也能在網頁上編輯（把 `TRIP.days` 也存到 Firebase）
- 同一網址支援多趟旅行（以 `TRIP.id` 區分）
- PWA：加 `manifest.json`、App 圖示、全螢幕模式
- 編輯密碼／登入
