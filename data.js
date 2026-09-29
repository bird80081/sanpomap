// 行程資料：改行程只需要改這個檔案
// type: food | cafe | sight | transport | stay
// q: Google Maps 搜尋關鍵字
// sym: 選填，卡片改用的線條圖示（index.html 的 i-xxx）；沒填時美食／咖啡／交通／住宿用類別圖示，景點用 icon 的 emoji
window.TRIP = {
  id: "trip-gp-hl",                     // Firebase 資料路徑
  dbUrl: "https://taiwan-trival-default-rtdb.firebaseio.com",
  title: "一路向南，<br>沿著海回來。",
  subtitle: "高雄・屏東・南迴・花蓮",
  journalNote: "把想去的地方，慢慢走成回憶。",
  // 封面主圖：url 填圖片網址（例如 Unsplash 的 images.unsplash.com/photo-…?w=1200&q=75），credit 填攝影師出處；留空時顯示粉藍漸層佔位
  cover: { url: "assets/coastal-train-editorial.png", credit: "AI 原創山海列車插畫，非景點實照" },
  badge: "2026.10.08 — 10.10",       // 前面的火車線條圖示由 app.js 加上
  start: "2026-10-08",                  // Day 1 的日期；旅行當天打開網站會自動跳到當日行程
  stats: [                              // 第一欄是 index.html 內的線條圖示名稱（i-xxx）
    ["cal", "3天2夜", "天數"], ["people", "雙人", "旅伴"],
    ["train", "臺鐵＋租車", "交通"], ["bed", "高雄・花蓮", "住宿"]
  ],
  // 天氣預報：依實際行程時段顯示各地的小時預報
  weather: {
    // 座標取海邊平地（落在山區會抓到山上的氣溫）
    1: [{ name: "高雄", time: "12:00", lat: 22.627, lon: 120.301 }, { name: "大鵬灣・海上教堂", time: "17:00", lat: 22.456, lon: 120.482, coast: true, sunset: true }],
    2: [{ name: "枋寮", time: "10:00", lat: 22.366, lon: 120.594, coast: true }, { name: "金崙", time: "14:00", lat: 22.532, lon: 120.968, coast: true }, { name: "花蓮", time: "21:00", lat: 23.976, lon: 121.604 }],
    3: [{ name: "崇德", time: "10:00", lat: 24.162, lon: 121.655, coast: true }, { name: "花蓮", time: "15:00", lat: 23.976, lon: 121.604 }]
  },
  days: {
    1: { route: "臺北 ・ 高雄車站 ・ 勝利星村 ・ 大鵬灣 ・ 東港", overview: "臺北 → 高雄 → 勝利星村 → 大鵬灣 → 東港 → 高雄", color: "#C4A073", soft: "#F4EBE0", travelmode: "driving", routeLabel: "Google Maps 開啟 Day 1 高雄起訖自駕路線", spots: [
      { id: "fixed-01", shortLabel: "臺北", time: "08:00", title: "臺北車站出發｜111 次", tag: "🚆 已購票・已劃位", icon: "🚉", type: "transport", desc: "111 次已購票並完成劃位，搭乘前往高雄，12:04 抵達；發車時間請以車票為準，提早到站候車。", q: "臺北車站", inDayRoute: false },
      { id: "fixed-02", shortLabel: "高雄", time: "12:04", title: "高雄車站", tag: "🚆 臺鐵抵達", icon: "🚉", type: "transport", desc: "搭乘自強 111 次 12:04 準時抵達高雄，出站準備前往取車展開南部旅程。", q: "高雄車站" },
      { id: "fixed-03", shortLabel: "取汽車", time: "12:15–13:00", title: "高雄車站附近取 iRent", tag: "🚗 租車取件", icon: "🚘", type: "transport", desc: "以 App 實際可預約站點為準，行李放置後車廂，出發前確認 90 分鐘折抵券效期、車款與用車門檻；還車結帳時選券並確認折抵後再付款。取還車站點及預約尚待確認。", q: "高雄火車站 iRent" },
      { id: "fixed-04", sym: "historic", shortLabel: "勝利星村", time: "13:45–14:45", title: "勝利星村創意生活園區", tag: "🌿 日式眷村", icon: "🍡", type: "sight", desc: "安排 45–60 分鐘漫步全台最大日式官舍建築群，逛特色獨立書店與文創選物店。", q: "勝利星村創意生活園區" },
      { id: "fixed-05", sym: "beach", shortLabel: "大鵬灣・海上教堂", time: "16:35–17:50", title: "大鵬灣＆海上教堂咖啡", tag: "🌅 潟湖落日", icon: "🌊", type: "sight", desc: "在海上教堂咖啡吃甜點看海，等 17:39 日落（咖啡 18:20 最後收客），再沿大鵬灣濱灣碼頭或單車道散步，之後開回高雄還車。", q: "大鵬灣海上教堂咖啡" },
      { id: "fixed-06", sym: "market", shortLabel: "東港", time: "15:20–16:20", title: "東港華僑市場", tag: "🍣 在地鮮味", icon: "🦐", type: "food", desc: "品嚐現切生魚片、旗魚黑輪等在地小吃，吃個半飽、留胃給海上教堂的甜點；生鮮攤午後陸續收、熱門小吃常下午就賣完，看到想吃的先買。", q: "東港華僑市場" },
      { id: "fixed-07", shortLabel: "喜迎旅店", time: "約 19:30", title: "入住喜迎旅店 Greet Inn", tag: "🏨 高雄夜宿", icon: "🛏️", type: "stay", desc: "完成還車手續後步行至旅店辦理入住，捷運前金站O4旁，翌日早晨不需再處理租車事宜。", q: "喜迎旅店 Greet Inn" }
    ]},
    2: { route: "喜迎旅店 ・ 鳳山 ・ 枋寮 ・ 金崙 ・ 臺東 ・ 花蓮", overview: "喜迎旅店 → 鳳山 → 枋寮 → 金崙 → 臺東 → 花蓮入住", color: "#6E9E9A", soft: "#E6F0EF", travelmode: "transit", spots: [
      { id: "fixed-08", shortLabel: "喜迎旅店", time: "建議 08:15", title: "喜迎旅店退房", tag: "🏨 今日出發點", icon: "🧳", type: "transport", desc: "07:45 先空手到同一條路的興隆居買外帶早餐，08:15 回飯店帶齊行李退房，08:20 出發前往捷運前金站，搭橘線至捷運鳳山站，再步行至臺鐵鳳山站，預留 09:12 搭車的候車時間。", q: "喜迎旅店 Greet Inn" },
      { id: "fixed-09", shortLabel: "鳳山", time: "09:12", title: "臺鐵鳳山站", tag: "🚆 3005次 區間快", icon: "🚉", type: "transport", desc: "自前金站搭橘線至捷運鳳山站，再步行至臺鐵鳳山站；搭乘 3005 次區間快，09:12 出發、10:10 抵達枋寮。上車後吃興隆居外帶早餐（捷運上不能吃喝）。", q: "鳳山火車站" },
      { id: "fixed-10", shortLabel: "枋寮", time: "10:10–10:25", title: "枋寮車站", tag: "🧳 寄放行李（待確認）", icon: "🎒", type: "transport", desc: "10:10 抵達枋寮，先確認車站當日寄物服務、受理時間與容量，再寄放登機箱；尚未確認可寄放，無法寄放時帶著走並縮短散步。貴重物品放入背包隨身攜帶。", q: "枋寮火車站" },
      { id: "fixed-11", sym: "art", shortLabel: "枋寮", time: "10:25–10:55", title: "枋寮彩虹藝鐵", tag: "🎨 鐵道藝術聚落", icon: "🌈", type: "sight", desc: "從車站旁進入由舊臺鐵宿舍改造的園區，沿綠蔭步道欣賞彩繪、裝置藝術與老屋，停留約 30 分鐘。", q: "枋寮彩虹藝鐵" },
      { id: "fixed-24", shortLabel: "枋寮", time: "11:00–11:20", title: "枋寮韭菜盒子＆豬肉餡餅", tag: "🥟 在地銅板小吃", icon: "🥟", type: "food", meals: ["午餐"], desc: "買韭菜盒子或豬肉餡餅墊胃，建議吃約五、六分飽；店家可能排隊或提早售完，沒買到就直接前往漁港。", q: "枋寮韭菜盒子 豬肉餡餅" },
      { id: "fixed-25", sym: "anchor", shortLabel: "枋寮", time: "11:20–11:50", title: "枋寮漁港＆跨港情人橋", tag: "⚓ 漁村海風", icon: "⛵", type: "sight", desc: "沿中興路前往漁港，看看漁船與出海口，再走上跨港情人橋眺望港區；港邊遮蔭較少，記得防曬。", q: "枋寮漁港 跨港情人橋" },
      { id: "fixed-26", shortLabel: "枋寮", time: "11:50–12:29", title: "返回枋寮車站", tag: "🎒 領行李・12:29 莒光", icon: "🎒", type: "transport", desc: "11:50 開始返回車站，先領回登機箱，12:10 前完成候車準備，搭乘 12:29 的莒光 727 次。", q: "枋寮火車站" },
      { id: "fixed-22", shortLabel: "枋寮", time: "12:29–13:44", title: "莒光 727 次｜枋寮 → 金崙", tag: "🚆 已購票・已劃位", icon: "🚆", type: "transport", desc: "搭乘莒光 727 次前往金崙；暫依現行時刻 12:29 出發、13:44 抵達，已購票並完成劃位，時間以 10/9 票面為準。行李隨車帶往金崙。", q: "枋寮火車站" },
      { id: "fixed-23", shortLabel: "金崙", time: "13:44–14:20", title: "鼎倫牛肉麵", tag: "🍜 售完改力卡", icon: "🍜", type: "food", meals: ["午餐"], desc: "下車後先前往鼎倫確認是否仍能點餐，推薦紅燒牛肉麵、手工水餃與滷味；若連假排隊、提早售完或停止收客，直接改到力卡珈琲吃輕食。", q: "鼎倫牛肉麵" },
      { id: "fixed-27", sym: "church", shortLabel: "金崙", time: "14:20–14:45", title: "金崙聖若瑟天主堂", tag: "⛪ 排灣族信仰文化", icon: "⛪", type: "sight", desc: "欣賞黑色石板、陶甕外型與排灣族圖騰交織的教堂建築；這裡是地方信仰空間，入內請放低音量並避免打擾活動。", q: "金崙聖若瑟天主堂" },
      { id: "fixed-28", shortLabel: "金崙", time: "14:45–15:30", title: "LI.KA CAFE 力卡珈琲", tag: "☕ 部落風味午茶", icon: "☕", type: "cafe", desc: "品嚐刺蔥或馬告風味飲品、紅烏龍貝果、小米粽或小米酒粕甜點；抵達時可先詢問是否能暫放一個登機箱，寄放尚未確認；無法寄放時，海灘改為涵洞附近短停，兩人輪流看顧行李。", q: "LI.KA CAFE 力卡珈琲" },
      { id: "fixed-29", sym: "beach", shortLabel: "金崙", time: "15:30–16:15", title: "金崙涵洞＆金崙海灘", tag: "🌊 黑礫石海岸", icon: "🌊", type: "sight", desc: "穿過鐵道小涵洞抵達黑礫石海灘，看太平洋與金崙大橋；登機箱不要拖進礫石灘，若無處寄放，可在涵洞附近輪流看顧。", q: "金崙海灘" },
      { id: "fixed-30", shortLabel: "金崙", time: "16:15–16:56", title: "返回金崙車站", tag: "🎒 取行李・16:56 已劃位", icon: "🎒", type: "transport", desc: "16:15 離開海灘，若有寄放行李先取回，建議 16:30 抵達金崙站，準備搭乘已劃位的 441 次。", q: "金崙車站" },
      { id: "fixed-12", shortLabel: "金崙", time: "16:56–17:29", title: "自強 441 次｜金崙 → 臺東", tag: "🚆 已劃位", icon: "🚆", type: "transport", desc: "已確認劃位區間為金崙至臺東。暫依現行時刻 16:56 自金崙出發、17:29 抵達臺東；實際發車時間以 10/9 車票為準。", q: "金崙車站" },
      { id: "fixed-13", inDayRoute: false, shortLabel: "臺東", time: "17:29–18:20", title: "臺東火車站", tag: "🍱 轉乘 66 分・買晚餐", icon: "🍙", type: "food", desc: "17:29 抵達臺東，兩車相隔 66 分鐘，在站內採買臺東鐵路便當與飲料，18:20 回月台。", q: "臺東火車站" },
      { id: "fixed-31", shortLabel: "臺東", time: "18:35–20:33", title: "自強 445 次｜臺東 → 花蓮", tag: "🚆 已購票・已劃位", icon: "🚆", type: "transport", desc: "445 次已購票並完成劃位，暫排 18:35 自臺東站出發，車上吃先前買好的晚餐，20:33 抵達花蓮。實際時間以 10/9 車票及當日班表為準。", q: "臺東火車站" },
      { id: "fixed-14", shortLabel: "花蓮住宿", time: "20:33–21:00", title: "入住 Have Fun 225", tag: "🏡 花蓮夜宿", icon: "🌙", type: "stay", desc: "搭 445 次於 20:33 抵達花蓮站，前往民宿辦理入住，翌日退房後行李隨 iRent 汽車帶走。", q: "花蓮市國盛二街225號" },
    ]},
    3: { route: "Have Fun 225 ・ 崇德礫灘 ・ 新城老街 ・ 將軍府 ・ 花蓮站", overview: "Have Fun 225 → 取 iRent 汽車 → 崇德礫灘 → 新城 → 將軍府 → 花蓮站", color: "#86A474", soft: "#E9F0E2", travelmode: "driving", spots: [
      { id: "fixed-15", shortLabel: "花蓮住宿", time: "建議 08:30", title: "Have Fun 225 退房", tag: "🏡 今日出發點", icon: "🧳", type: "transport", desc: "退房時帶齊一個登機箱與一個背包，前往 iRent 取汽車；行李放後車廂，貴重物品隨身攜帶。預計 09:00 取車，實際站點與預約待確認，不需寄放或回民宿取行李。", q: "花蓮市國盛二街225號" },
      { id: "fixed-16", shortLabel: "取 iRent", time: "09:00–09:20", title: "花蓮取 iRent 汽車", tag: "🚗 尚待預約", icon: "🚗", type: "transport", desc: "10/10 已決定租 iRent 汽車，預計 09:00 取車、16:20 前完成還車，規劃使用第 2 張 90 分鐘折抵券。尚待確認車源、取還車站點、預約與券的效期／門檻；以下導航暫以花蓮站為集合點，訂妥後改成實際取車位置。", q: "花蓮火車站" },
      { id: "fixed-17", sym: "beach", shortLabel: "崇德", time: "10:10–10:40", title: "崇德礫灘", tag: "⛰️ 眺望清水斷崖", icon: "🌊", type: "sight", desc: "預留約 50–60 分鐘車程前往崇德下台地，凝望太平洋海浪與蘇花斷崖鬼斧神工（出發前確認道路與海灘開放情況，視天氣、浪況彈性調整）。", q: "崇德礫灘" },
      { id: "fixed-18", sym: "church", shortLabel: "新城", time: "11:00–12:00", title: "新城老街 ＆ 新城天主堂", tag: "⛪ 綠色方舟", icon: "🌿", type: "sight", desc: "造訪綠意盎然的聖母諾亞方舟船型教堂（原日式神社鳥居遺址），順遊老街照相館與佳興冰果室。", q: "新城天主堂" },
      { id: "fixed-19", shortLabel: "將軍府", time: "13:00–14:40", title: "定置漁場三代目 ＆ 將軍府1936", tag: "🍜 美食散步", icon: "🏡", type: "food", desc: "品嚐定置漁場鮮美魚白湯拉麵（備案家咖哩），隨後在美崙溪畔日式官舍聚落悠哉漫步。", q: "花蓮將軍府1936園區" },
      { id: "fixed-20", shortLabel: "邊境甜點", time: "15:00–15:40", title: "邊境法式點心坊", tag: "🍰 法式午茶", icon: "☕", type: "cafe", desc: "享用花蓮最道地的法式手工甜點作收尾（出發前確認雙十連假營業公告；滿座改外帶）。", q: "邊境法式點心坊" },
      { id: "fixed-21", shortLabel: "花蓮站", time: "16:20–18:15", title: "iRent 還車＆自強 285 次返臺北", tag: "🚆 已購票・已劃位", icon: "🚉", type: "transport", desc: "以 16:20 完成還車為目標，下車時帶齊登機箱、背包與隨身物品，再由還車站點前往花蓮站，17:15 前抵達，可買晚餐與伴手禮。285 次已購票並完成劃位，暫排 18:15 返臺北，發車時間以票面為準；iRent 還車付款前確認第 2 張 90 分鐘折抵券已套用。", q: "花蓮火車站" }
    ]}
  },
  // 停車場：來源為 Notion「停車場」資料庫（2026-09-29 查證）；q 是 Google Maps 導航關鍵字
  // 行程卡片的 parking：main／backup（backup2 選填，備案也滿時的第三選擇） 對應這裡的 key，walk／backupWalk 是停車後步行分鐘（選填），note 是這個地點專屬的提醒
  parkingLots: {
    "kx": { name: "勝利星村空翔區停車場", fee: "平日每次 30 元", info: "線上繳費車牌要打完整、含中間的槓", warn: "不收現金，只收一卡通／多元支付", q: "勝利星村空翔區停車場" },
    "bo": { name: "勝利星村停車場（博愛路 202 號）", fee: "平日每次 30 元・24 小時", q: "勝利星村停車場 屏東市博愛路202號" },
    "qd": { name: "青島街長春街口路外停車場（長春街 2 號）", fee: "現場為準・24 小時", info: "室外平面停車場", q: "青島街長春街口路外停車場 屏東市長春街2號" },
    "church": { name: "海上教堂旁停車場", fee: "現場為準（近年多免費）", info: "停好沿海堤走約 300 公尺到教堂", q: "海上教堂咖啡" },
    "dbnsa": { name: "大鵬灣管理處停車場", fee: "現場為準", info: "離教堂約 0.9 公里", q: "大鵬灣管理處停車場" },
    "city": { name: "CITY PARKING 城市車旅 東港站", fee: "每小時 20 元，全天上限 100 元・24 小時", warn: "別導到新生路「東港碼頭停車場」，18:00 打烊", q: "CITY PARKING 城市車旅停車場 東港站" },
    "dgadm": { name: "東港行政中心立體停車場", fee: "每小時 20 元・24 小時", q: "東港行政中心立體停車場" },
    "cdbeach": { name: "崇德海灘入口停車場", fee: "免費（部落格資料）", info: "台 9 線 178.2K 入口，穿鐵道涵洞到海灘", q: "崇德礫灘" },
    "cdrest": { name: "崇德休憩區停車場", fee: "免費", warn: "步道受損下不到海灘，只能在觀景台看清水斷崖；車位少", q: "崇德休憩區" },
    "xcchurch": { name: "新城天主堂旁路邊停車", fee: "現場為準", q: "新城天主堂 花蓮縣新城鄉博愛路64號" },
    "xcschool": { name: "新城國小周邊白線停車", fee: "白線區，現場為準", q: "新城國小 花蓮縣新城鄉" },
    "jjf": { name: "將軍府停車場", fee: "免費", info: "中正路與新興路口（石屋燒肉旁右轉）；汽車格常被機車佔用", q: "將軍府停車場 花蓮市" },
    "jjfroad": { name: "中正路周邊路邊停車格", fee: "每小時 10–40 元，30 分鐘計費", q: "花蓮將軍府1936" },
    "mz": { name: "中山明智停車場", fee: "每小時 10–40 元，30 分鐘計費", info: "明智街 61 號，店對面", warn: "別導到掛在點心坊門牌的「明智停車場（免費）」", q: "中山明智停車場 花蓮市" },
    "mx": { name: "明心停車場", fee: "每小時 10–40 元，30 分鐘計費", q: "明心停車場 花蓮市" }
  },
  parking: {
    "fixed-04": { main: "kx", backup: "bo", backup2: "qd", note: "10/8 是平日，空翔區與博愛路都是每次 30 元。" },
    "fixed-05": { main: "church", walk: 5, backup: "dbnsa", note: "教堂與大鵬灣同一區，停一次就好。教堂 18:20 最後收客；教堂內只有一間廁所，附近有公廁。" },
    "fixed-06": { main: "city", backup: "dgadm", note: "立體停車場走天橋直達市場上方；10/8 是平日下午，應該好停。" },
    "fixed-17": { main: "cdbeach", backup: "cdrest", note: "出發前確認 178.2K 入口與涵洞可通行。" },
    "fixed-18": { main: "xcchurch", backup: "xcschool", note: "停一次，步行逛完天主堂與老街。" },
    "fixed-19": { main: "jjf", walk: 3, backup: "jjfroad", note: "連假週六建議提早 30 分鐘到；用餐時段先抽號碼牌。" },
    "fixed-20": { main: "mz", walk: 1, backup: "mx", backupWalk: 4, note: "店門正對面另有國安里「國 13」公有停車場（Google Maps 查無地標，到現場看）。" }
  },
  ticketTip: "<b>連假車流多</b>，自駕段預留車程與停車緩衝。",
  // 票券：id 固定不可改（網頁上的調整以 id 對應）；status = reserved（已劃位）| booked（已預約）| open（無對號）| pending（待預約）
  // spot 對應行程卡片 id，點票券可跳到那一站；seat 選填，填了就會顯示（例如 "5 車 12 號"）
  tickets: [
    { id: "ticket-01", day: 1, leg: "臺北 → 高雄", mode: "🚆 自強 111 次", time: "08:00–12:04", status: "reserved", note: "發車以車票為準", spot: "fixed-01", seat: "" },
    { id: "ticket-02", day: 1, leg: "高雄 → 屏東 → 東港 → 高雄", mode: "🚗 iRent 汽車", time: "12:15–19:00", status: "pending", note: "取還車站點與預約待確認；使用第 1 張 90 分鐘折抵券", spot: "fixed-03" },
    { id: "ticket-03", day: 2, leg: "鳳山 → 枋寮", mode: "🚆 3005 次 區間快", time: "09:12–10:10", status: "open", note: "無對號座，當日確認班表", spot: "fixed-09" },
    { id: "ticket-04", day: 2, leg: "枋寮 → 金崙（南迴）", mode: "🚆 莒光 727 次", time: "12:29–13:44", status: "reserved", note: "時間待對照票面", spot: "fixed-22", seat: "" },
    { id: "ticket-05", day: 2, leg: "金崙 → 臺東", mode: "🚆 自強 441 次", time: "16:56–17:29", status: "reserved", note: "以車票為準", spot: "fixed-12", seat: "" },
    { id: "ticket-06", day: 2, leg: "臺東 → 花蓮", mode: "🚆 自強 445 次", time: "18:35–20:33", status: "reserved", note: "臺東轉乘 66 分，18:20 回月台；便當售完改買站內其他餐食", spot: "fixed-31", seat: "" },
    { id: "ticket-07", day: 3, leg: "花蓮 ↔ 崇德・新城", mode: "🚗 iRent 汽車", time: "09:00–16:20", status: "pending", note: "待預約；使用第 2 張 90 分鐘折抵券", spot: "fixed-16" },
    { id: "ticket-08", day: 3, leg: "花蓮 → 臺北", mode: "🚆 自強 285 次", time: "18:15 發車", status: "reserved", note: "發車時間以票面為準", spot: "fixed-21", seat: "" }
  ],
  ticketNote: "<b>iRent 折抵券操作：</b>還車流程選券 → 核對租金折抵 → 還車付款；每筆訂單一張，里程及其他費用另計。",
  // 行前待確認：初始清單。網頁上可勾選、修改、刪除、新增（存 Firebase，以 prep-序號 對應，請勿調動既有順序）；出發前預設展開、旅途開始後自動收合
  // 行李清單：初始項目 [分類, 項目]。網頁上可新增／修改／刪除（兩人共用，存 Firebase，以 pack-序號 對應，請勿調動既有順序）；打勾只記在各自手機
  packGroups: ["證件錢包", "電子用品", "衣物", "盥洗保養", "其他"],
  packing: [
    ["證件錢包", "身分證"], ["證件錢包", "駕照（取 iRent 要用）"], ["證件錢包", "健保卡"], ["證件錢包", "信用卡、悠遊卡／一卡通"], ["證件錢包", "現金（小吃、攤商常只收現金）"],
    ["電子用品", "手機"], ["電子用品", "充電器與充電線"], ["電子用品", "行動電源"],
    ["衣物", "換洗衣物（2 晚）"], ["衣物", "薄外套（火車冷氣、海邊風大）"], ["衣物", "好走的鞋"],
    ["盥洗保養", "牙刷牙膏"], ["盥洗保養", "保養品"], ["盥洗保養", "防曬乳"], ["盥洗保養", "個人藥品"],
    ["其他", "水壺"], ["其他", "帽子、太陽眼鏡"], ["其他", "折疊傘"], ["其他", "環保袋"]
  ],
  prep: [
    "列車：111、727、441、445、285 次，網頁時間逐一對照票面；3005 次區間快確認當日班表。",
    "租車：高雄、花蓮 iRent 的取還車站點與預約；兩張折抵券的效期、連假適用與最低用車門檻。",
    "行李／住宿：枋寮寄物服務、金崙寄放備案、Have Fun 225 晚間入住方式；兩晚訂房資訊核對。",
    "餐食／景點：華僑市場下午攤商、鼎倫最後點餐、力卡與邊境的連假營業；崇德道路與海灘開放情況；早餐：Day 1 路上買小吃；Day 2 07:45 興隆居外帶、上臺鐵再吃（9/28–10/6 整修停業，10/7 恢復，前一天再看公告）。"
  ],
  stays: [
    { icon: "🛏️", day: "Day 1・高雄", name: "喜迎旅店 Greet Inn", info: "高雄市前金區六合二路161號・捷運前金站O4旁", q: "喜迎旅店 Greet Inn" },
    { icon: "🌙", day: "Day 2・花蓮", name: "Have Fun 225", info: "花蓮縣花蓮市國盛二街225號・Day 3 退房後行李隨車帶走", q: "花蓮市國盛二街225號" }
  ],
  footer: ["部分圖示依 CNS 16282 台灣公共圖標（經濟部標準檢驗局，CC BY 4.0）改繪"]
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
