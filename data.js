// 行程資料：改行程只需要改這個檔案
// type: food | cafe | sight | transport | stay
// q: Google Maps 搜尋關鍵字
window.TRIP = {
  id: "trip-gp-hl",                     // Firebase 資料路徑
  dbUrl: "https://taiwan-trival-default-rtdb.firebaseio.com",
  title: "高屏・南迴・花蓮<br>3天這樣玩！",
  badge: "🚆 雙人山海慢步・2026/10/8 – 10/10",
  start: "2026-10-08",                  // Day 1 的日期；旅行當天打開網站會自動跳到當日行程
  stats: [
    ["📅", "3天2夜", "天數"], ["👫", "雙人", "旅伴"],
    ["🚆", "臺鐵＋租車", "交通"], ["🏨", "高雄・花蓮", "住宿"]
  ],
  days: {
    1: { route: "臺北 ・ 高雄車站 ・ 勝利星村 ・ 大鵬灣 ・ 東港", overview: "臺北 → 高雄 → 勝利星村 → 大鵬灣 → 東港 → 高雄", color: "#C4A073", soft: "#F4EBE0", travelmode: "driving", routeLabel: "🗺️ Google Maps 開啟 Day 1 高雄起訖自駕路線", spots: [
      { id: "fixed-01", shortLabel: "臺北", time: "08:00", title: "臺北車站出發｜111 次", tag: "🚆 臺北 → 高雄", icon: "🚉", type: "transport", desc: "依原行程搭乘 111 次前往高雄，12:04 抵達；發車時間請以車票為準，提早到站候車。", q: "臺北車站", inDayRoute: false },
      { id: "fixed-02", shortLabel: "高雄", time: "12:04", title: "高雄車站（抵達）", tag: "🚆 臺鐵抵達", icon: "🚉", type: "transport", desc: "搭乘自強 111 次 12:04 準時抵達高雄，出站準備前往取車展開南部旅程。", q: "高雄車站" },
      { id: "fixed-03", shortLabel: "取汽車", time: "12:15–13:00", title: "高雄車站附近取 iRent", tag: "🚗 租車取件", icon: "🚘", type: "transport", desc: "以 App 實際可預約站點為準，行李放置後車廂，套用 90 分鐘折抵券後啟程往屏東。", q: "高雄火車站 iRent" },
      { id: "fixed-04", shortLabel: "勝利星村", time: "14:30–15:30", title: "勝利星村創意生活園區", tag: "🌿 日式眷村", icon: "🍡", type: "sight", desc: "安排 45–60 分鐘漫步全台最大日式官舍建築群，逛特色獨立書店與文創選物店。", q: "勝利星村創意生活園區" },
      { id: "fixed-05", shortLabel: "大鵬灣", time: "16:20–17:45", title: "大鵬灣看海與夕陽", tag: "🌅 潟湖落日", icon: "🌊", type: "sight", desc: "迎著海風漫步在濱灣碼頭或單車道，欣賞南台灣海天一色的金黃夕陽景緻。", q: "大鵬灣國家風景區" },
      { id: "fixed-06", shortLabel: "東港", time: "18:05–20:15", title: "東港晚餐（華僑市場）", tag: "🍣 在地鮮味", icon: "🦐", type: "food", desc: "品嚐現切生魚片、旗魚黑輪與在地熱炒美食，約 20:15 啟程開車返回高雄還車。", q: "東港華僑市場" },
      { id: "fixed-07", shortLabel: "喜迎旅店", time: "約 21:40", title: "入住喜迎旅店 Greet Inn", tag: "🏨 高雄夜宿", icon: "🛏️", type: "stay", desc: "完成還車手續後步行至旅店辦理入住，捷運前金站O4旁，翌日早晨不需再處理租車事宜。", q: "喜迎旅店 Greet Inn" }
    ]},
    2: { route: "喜迎旅店 ・ 鳳山 ・ 枋寮 ・ 金崙 ・ 臺東 ・ 花蓮", overview: "喜迎旅店 → 鳳山 → 枋寮 → 金崙 → 臺東 → 花蓮", color: "#6E9E9A", soft: "#E6F0EF", travelmode: "transit", spots: [
      { id: "fixed-08", shortLabel: "喜迎旅店", time: "建議 08:00", title: "喜迎旅店退房、出發", tag: "🏨 今日出發點", icon: "🧳", type: "transport", desc: "不在飯店吃早餐，帶齊行李退房後前往捷運前金站，搭橘線至捷運鳳山站，再步行至臺鐵鳳山站，預留 09:12 搭車的候車時間。", q: "喜迎旅店 Greet Inn" },
      { id: "fixed-09", shortLabel: "鳳山", time: "09:12", title: "臺鐵鳳山站（出發）", tag: "🚆 3005次 區間快", icon: "🚉", type: "transport", desc: "自前金站搭橘線至捷運鳳山站，再步行至臺鐵鳳山站；搭乘 3005 次區間快，09:12 出發、10:10 抵達枋寮。", q: "鳳山火車站" },
      { id: "fixed-10", shortLabel: "枋寮", time: "10:10–10:30", title: "枋寮火車站（寄放行李）", tag: "🧳 行李房寄放", icon: "🎒", type: "transport", desc: "10:10 抵達枋寮，先至車站行李房寄放大件行李，輕裝展開南國小鎮散步與早午餐。", q: "枋寮火車站" },
      { id: "fixed-11", shortLabel: "枋寮", time: "10:30–12:00", title: "枋寮漫步／漁港看海／咖啡", tag: "☕ 漁港海風", icon: "⛵", type: "sight", meals: ["早餐", "午餐"], desc: "在枋寮吃早午餐、車站周邊或漁港散步；建議 12:00 回站，若有寄放行李先領回，預留 12:29 搭乘 727 次的候車時間。", q: "枋寮漁港" },
      { id: "fixed-22", shortLabel: "枋寮", time: "12:29–13:44", title: "莒光 727 次｜枋寮 → 金崙", tag: "🚆 南迴線", icon: "🚆", type: "transport", desc: "搭乘莒光 727 次前往金崙；暫依現行時刻 12:29 出發、13:44 抵達，10/9 當日班表與票務待確認。行李隨車帶往金崙。", q: "枋寮火車站" },
      { id: "fixed-23", shortLabel: "金崙", time: "13:44–16:30", title: "金崙散步、海灘、部落午茶或簡短泡湯", tag: "🌊 金崙慢遊", icon: "🌊", type: "sight", desc: "抵達後在金崙散步、看海，部落午茶或簡短泡湯彈性擇一；金崙行李寄放與泡湯店家尚待確認。建議 16:30 結束活動、16:40 前回金崙站，準備搭已劃位的 441 次。", q: "金崙車站" },
      { id: "fixed-12", shortLabel: "金崙", time: "16:56–17:29", title: "EMU3000 441 次｜金崙 → 臺東", tag: "🚆 已劃位", icon: "🚆", type: "transport", desc: "已確認劃位區間為金崙至臺東。暫依現行時刻 16:56 自金崙出發、17:29 抵達臺東；實際發車時間以 10/9 車票為準。", q: "金崙車站" },
      { id: "fixed-13", shortLabel: "臺東", time: "17:29–18:20", title: "臺東火車站（轉乘、買晚餐）", tag: "🍱 車站轉乘66分", icon: "🍙", type: "food", desc: "17:29 抵達臺東，兩車相隔 66 分鐘，在站內採買臺東鐵路便當與飲料，18:20 回月台。", q: "臺東火車站" },
      { id: "fixed-14", shortLabel: "花蓮住宿", time: "20:33–21:00", title: "抵達花蓮 ＆ 入住 Have Fun 225", tag: "🏡 花蓮夜宿", icon: "🌙", type: "stay", desc: "搭 445 次於 20:33 抵達花蓮站，前往民宿辦理入住，並確認翌日行李寄放事宜。", q: "花蓮市國盛二街225號" }
    ]},
    3: { route: "Have Fun 225 ・ 崇德礫灘 ・ 新城老街 ・ 將軍府 ・ 花蓮站", overview: "Have Fun 225 → 取機車 → 崇德礫灘 → 新城 → 將軍府 → 花蓮站", color: "#86A474", soft: "#E9F0E2", travelmode: "driving", spots: [
      { id: "fixed-15", shortLabel: "花蓮住宿", time: "建議 08:30", title: "Have Fun 225 退房、寄放行李", tag: "🏡 今日出發點", icon: "🧳", type: "transport", desc: "先與民宿確認寄放及領取行李時間，完成退房後輕裝前往 Rilink X，預計 09:00 取機車。", q: "花蓮市國盛二街225號" },
      { id: "fixed-16", shortLabel: "取機車", time: "09:00–09:20", title: "Rilink X 取機車", tag: "🛵 租車出發", icon: "🛵", type: "transport", desc: "行李寄放 Have Fun 225 後，至 Rilink X 花蓮台鐵門市取車，雙人共乘出發北上。", q: "花蓮縣花蓮市國興二街42號" },
      { id: "fixed-17", shortLabel: "崇德", time: "10:10–10:40", title: "崇德礫灘（眺望清水斷崖）", tag: "⛰️ 峭壁海崖", icon: "🌊", type: "sight", desc: "騎乘約 50–60 分鐘抵達崇德下台地，凝望太平洋海浪與蘇花斷崖鬼斧神工（視浪況彈性調整）。", q: "崇德礫灘" },
      { id: "fixed-18", shortLabel: "新城", time: "11:00–12:00", title: "新城老街 ＆ 新城天主堂", tag: "⛪ 綠色方舟", icon: "🌿", type: "sight", desc: "造訪綠意盎然的聖母諾亞方舟船型教堂（原日式神社鳥居遺址），順遊老街照相館與佳興冰果室。", q: "新城天主堂" },
      { id: "fixed-19", shortLabel: "將軍府", time: "13:00–14:40", title: "定置漁場三代目 ＆ 將軍府1936", tag: "🍜 美食散步", icon: "🏡", type: "food", desc: "品嚐定置漁場鮮美魚白湯拉麵（備案家咖哩），隨後在美崙溪畔日式官舍聚落悠哉漫步。", q: "花蓮將軍府1936園區" },
      { id: "fixed-20", shortLabel: "邊境甜點", time: "15:00–15:40", title: "邊境法式點心坊", tag: "🍰 法式午茶", icon: "☕", type: "cafe", desc: "享用花蓮最道地的法式手工甜點作收尾（出發前確認雙十連假營業公告；滿座改外帶）。", q: "邊境法式點心坊" },
      { id: "fixed-21", shortLabel: "花蓮站", time: "16:20–18:15", title: "還機車、取行李 ＆ 臺鐵 285 次", tag: "🚆 EMU3000 賦歸", icon: "🚉", type: "transport", desc: "還車並回民宿取行李，17:15 前抵達花蓮站採買伴手禮，搭乘 18:15 的 285 次返抵臺北。", q: "花蓮火車站" }
    ]}
  },
  transitTip: "鳳山至枋寮搭<b>3005 次區間快</b>，無對號座；Day 1 高雄取 iRent 自駕，Day 3 花蓮騎 Rilink X 機車。<b>連假車流多</b>，預留車程與停車緩衝。",
  transit: [
    ["Day1 臺北 → 高雄", "🚆 111次", "08:00–12:04（發車以車票為準）"],
    ["Day1 高雄 → 屏東 → 東港 → 高雄", "🚗 iRent 自駕", "12:15–21:40"],
    ["Day2 鳳山 → 枋寮", "🚆 3005次 區間快", "09:12–10:10"],
    ["Day2 枋寮 → 金崙（南迴）", "🚆 莒光727次", "12:29–13:44（待核對）"],
    ["Day2 金崙 → 臺東", "🚆 441次・已劃位", "16:56–17:29（以車票為準）"],
    ["Day2 臺東 → 花蓮", "🚆 445次", "20:33 抵達"],
    ["Day3 花蓮 ↔ 崇德・新城", "🛵 Rilink X", "09:00–16:20"],
    ["Day3 花蓮 → 臺北", "🚆 285次", "18:15 發車"]
  ],
  transitNote: "<b>※ 臺東轉乘 66 分：</b>17:29 抵達、18:20 回月台，剛好在站內買臺東鐵路便當當晚餐。",
  stays: [
    { icon: "🛏️", day: "Day 1・高雄", name: "喜迎旅店 Greet Inn", info: "高雄市前金區六合二路161號・捷運前金站O4旁", q: "喜迎旅店 Greet Inn" },
    { icon: "🌙", day: "Day 2・花蓮", name: "Have Fun 225", info: "花蓮縣花蓮市國盛二街225號・Day 3 可寄放行李", q: "花蓮市國盛二街225號" }
  ],
  footer: ["🌿 祝你們擁有最溫柔愜意的山海時光・記得隨身攜帶水壺與防曬乳", "10/9 列車暫依現行時刻安排，當日班表待核對；441 次金崙至臺東已劃位・各景點營業依現場公告為準"]
};

window.TYPES = {
  food: { label: "🍜 美食", icon: "🍜", bg: "#F4E1D4" },
  cafe: { label: "☕ 咖啡甜點", icon: "☕", bg: "#EFE3D3" },
  sight: { label: "📍 景點", icon: "📍", bg: "#E4EEDD" },
  transport: { label: "🚆 交通", icon: "🚆", bg: "#DDE9E8" },
  stay: { label: "🏨 住宿", icon: "🏨", bg: "#F1E4D5" }
};

// 用餐提醒時段 [名稱, 開始小時, 結束小時, 預設時間]
window.MEALS = [["早餐", 7, 10.5, "08:30"], ["午餐", 11, 14, "12:30"], ["晚餐", 17, 20.5, "18:30"]];
