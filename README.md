# 高屏・南迴・花蓮 3日懶人包

手機優先的行程網頁：三天行程、新增行程（Firebase 即時同步）、Google Maps 導航、票券與住宿資訊，可離線開啟。
純 HTML／CSS／JavaScript，不需要安裝或編譯，可直接放上 GitHub Pages。

## 檔案
| 檔案 | 用途 |
|---|---|
| `index.html` | 版面骨架（各區塊的容器） |
| `data.js` | **所有行程內容**：每日景點、票券、行前待確認、住宿、Firebase 網址、類型與用餐時段 |
| `app.js` | 畫面渲染、Day 切換、新增／刪除行程、Firebase 同步、Google Maps 連結、用餐提醒 |
| `style.css` | 樣式（顏色變數在 `:root`），含列印版樣式 |
| `sw.js` | Service Worker：網頁檔案網路優先、失敗讀快取，開過一次後可離線開啟 |

## 本機預覽
直接用瀏覽器打開 `index.html`，或在資料夾執行 `npx serve .`。

## 發佈到 GitHub Pages
1. 把這個資料夾的所有檔案放到 repository 根目錄。
2. Settings → Pages → Branch 選 `main`、資料夾 `/ (root)` → Save。
3. 網址：`https://<帳號>.github.io/<repo>/`

## 功能說明
- **固定行程**：寫在 `data.js` 的 `TRIP.days[n].spots`。欄位：`time`、`title`、`tag`、`icon`、`type`、`desc`、`q`（Google Maps 搜尋字），選填 `meals`（例如 `["早餐", "午餐"]`，標明這段行程已涵蓋哪幾餐）。
- **新增行程**：使用者在網頁上新增，存到 Firebase `/{TRIP.id}/extra/{day}/{id}`，依 `time` 中第一個 `HH:MM` 自動排序；時間無法解析的排最後。
- **即時同步**：使用 Firebase Realtime Database 的 REST API + `EventSource` 串流，不需要 Firebase SDK 或 apiKey。`TRIP.dbUrl` 留空則改存 localStorage（僅本機）。
- **今天模式**：`TRIP.start` 是 Day 1 日期，各天日期（10/8…）也由它推算，換旅程只要改這裡。旅行期間打開網站會自動切到當天、捲到行程，並標出「進行中／下一站」（每分鐘更新）。測試可在網址加 `?now=2026-10-09T15:00` 模擬時間；此時畫面下方會出現紅色「🧪 測試模式」提示條，點「回到現在」恢復。
- **調整收合**：每張卡片的「編輯／取消行程」收在「✏️ 調整」裡，點了才出現，避免旅途中誤觸。
- **票券**：`TRIP.tickets`，欄位 `id`（固定，網頁調整以它對應）、`day`、`leg`、`mode`、`time`、`status`（`reserved` 已劃位／`booked` 已預約／`open` 無對號／`pending` 待預約）、`note`、`spot`（對應行程卡 id，點「看行程這一站」會跳過去）、選填 `seat`（填了就顯示座位）。網頁上每張票券可按「✏️ 調整」改狀態、座位、備註，存到 Firebase `/{TRIP.id}/extra/{day}/{票券 id}`（`kind: "ticket"`，沿用既有路徑格式），「恢復原訂」會刪掉這筆調整。
- **行前待確認**：`TRIP.prep`，放在封面下方；只列還沒確認的事，確認完就從 data.js 刪掉。出發前預設展開，旅途開始後自動收合，清空時整塊隱藏。
- **離線**：`sw.js` 快取網頁檔案與字型；Firebase 最後一次同步的內容存在 localStorage（`{TRIP.id}-extra-cache`），離線時顯示並標示「離線中」。離線時無法新增或修改行程。
- **PDF 備份**：頁尾「📄 存成 PDF」會把三天行程、票券、住宿攤開成列印版，手機選「列印 → 存成 PDF」即可。
- **快速導覽**：上方 4 顆按鈕；捲過後改為固定在畫面頂端的導覽列，並標示目前所在區塊。
- **用餐提醒**：`MEALS` 定義早／午／晚餐時段；若當天行程涵蓋該時段，但沒有時間區間重疊的 `type: "food"` 項目、也沒有項目以 `meals` 標明涵蓋，就顯示「還沒安排」。
- **Google Maps 整日路線**：`/maps/dir/?api=1`，起點＝當天第一站、終點＝最後一站、中途點最多 9 個（Google 限制）。`travelmode` 由每日的 `travelmode` 設定；`transit`（大眾運輸）不支援中途點，只開起訖。

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
- PWA：加 `manifest.json`、App 圖示、全螢幕模式（離線快取已由 `sw.js` 完成）
- 編輯密碼／登入

## 行程編輯與取消
- 固定行程以 `data.js` 中的穩定 `id` 對應；新增或重排行程時請保留既有 ID，新項目使用未用過的 ID。
- 固定行程修改以 `kind: "override"` 存入既有 `/{TRIP.id}/extra/{day}/{id}`；原本新增行程的數字 ID、路徑不變，不需遷移。
- 每張卡可編輯時間、名稱、地點、類型、備註與標籤；取消以 `cancelled: true` 保存，從「已取消行程」恢復。
- 行程、路線總覽、導航與用餐提醒依修改後內容重算。票券區是訂票紀錄，不隨行程編輯變動。
- 儲存成功後才更新畫面；失敗保留表單供重試。雲端同步時不重畫正在輸入的表單。同一行程多人同時編輯，以最後成功寫入為準。
