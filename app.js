(() => {
  const T = window.TRIP, TYPES = window.TYPES, MEALS = window.MEALS;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hr = t => { const m = String(t).match(/(\d{1,2}):(\d{2})/); return m ? +m[1] + m[2] / 60 : 99; };
  // 時間區間：取第一個與最後一個 HH:MM，例如 "10:30–14:20" → [10.5, 14.33]
  const span = t => { const m = [...String(t).matchAll(/(\d{1,2}):(\d{2})/g)].map(x => +x[1] + x[2] / 60); return m.length ? [m[0], m[m.length - 1]] : [99, 99]; };
  const ty = t => TYPES[t] || TYPES.sight; // 雲端資料若出現未知類型，不讓畫面壞掉
  const gmap = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  const maps = window.TripMaps;
  // 票券狀態：[文字, 樣式, 線條圖示]
  const STATUS = { reserved: ["已劃位", "ok", "check"], noseat: ["無座位", "open", "ticket"], booked: ["已預約", "ok", "check"], open: ["無對號", "open", "ticket"], pending: ["待預約", "wait", "hourglass"] };
  // 通用線條圖示（index.html 的 <symbol id="i-xxx">）
  const ico = n => `<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  // 卡片圖示：有 sym 用指定線條圖示；美食、咖啡、交通、住宿用類別圖示（依 CNS 16282 改繪）；其餘景點用 emoji
  function cardIcon(s) {
    if (s.sym) return ico(s.sym);
    if (s.type === "stay") return ico("bed");
    if (s.type === "food" || s.type === "cafe") return ico(s.type);
    if (s.type === "sight") return s.custom ? ico("pin") : esc(s.icon);
    if (s.type !== "transport") return esc(s.icon);
    return ico(/🚘|🚗/.test(s.icon) ? "car" : /🧳|🎒/.test(s.icon) ? "bag" : "train");
  }
  // 行程標籤開頭的 emoji 換成對應的線條圖示（沒對應到的維持原字）
  const TAG_ICON = { "🚆": "train", "🚉": "train", "🚗": "car", "🧳": "bag", "🎒": "bag", "🏨": "bed-s", "🏡": "bed-s",
    "☕": "cafe", "🍰": "cafe", "🍜": "food", "🍣": "food", "🍱": "food", "🍳": "food", "🥟": "food",
    "⚓": "anchor", "⛪": "church", "🎨": "art", "🌿": "historic", "🌊": "beach", "🌅": "sunset", "⛰": "mountain" };
  function tagHtml(t) {
    const m = String(t).match(/^(\S+)\s+(.+)$/), key = m && m[1].replace(/\uFE0F/g, "");
    return m && TAG_ICON[key] ? ico(TAG_ICON[key]) + esc(m[2]) : esc(t);
  }
  // 新增行程表單的類別按鈕圖示
  const TYPE_ICON = { food: "food", cafe: "cafe", sight: "pin", transport: "train", stay: "bed-s" };
  const LOCAL_KEY = T.id + "-extra";
  const CACHE_KEY = T.id + "-extra-cache"; // 上次雲端同步的副本，離線時顯示
  const DB = T.dbUrl ? T.dbUrl.replace(/\/+$/, "") + "/" + T.id + "/extra" : "";

  // ---------- 今天模式 ----------
  // 網址加 ?now=2026-10-09T15:00 可模擬旅途中的某個時間（測試用）
  const nowParam = new URLSearchParams(location.search).get("now");
  const now = () => (nowParam && !isNaN(new Date(nowParam)) ? new Date(nowParam) : new Date());
  // 第 n 天的日期（M/D），由 T.start 推算
  function dayDate(n) {
    const [y, m, dd] = T.start.split("-").map(Number), d = new Date(y, m - 1, dd + (+n - 1));
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  function todayDay() {
    if (!T.start) return 0;
    const [y, m, dd] = T.start.split("-").map(Number), n = now();
    const diff = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(y, m - 1, dd)) / 864e5) + 1;
    return T.days[diff] ? diff : 0;
  }
  // 還沒出發（今天早於 Day 1）
  function beforeTrip() {
    const [y, m, dd] = T.start.split("-").map(Number), n = now();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate()) < new Date(y, m - 1, dd);
  }
  // 當天第一個還沒結束的項目：已開始＝進行中，未開始＝下一站
  function nextItem(items) {
    const n = now(), h = n.getHours() + n.getMinutes() / 60;
    const s = items.find(x => hr(x.time) < 99 && span(x.time)[1] >= h);
    return s ? { item: s, label: hr(s.time) <= h ? ico("hourglass") + "進行中" : ico("next") + "下一站" } : null;
  }

  const state = { day: todayDay() || 1, form: null, tform: null, prepEdit: null, packEdit: null, adjust: null, expanded: new Set(), parkOpen: new Set(), extra: { 1: [], 2: [], 3: [] }, busy: false, error: "", sync: DB ? "connecting" : "local" };

  // 正在填行程或票券表單時，雲端同步與定時更新都不重畫，避免打到一半的字被清掉
  const editing = () => state.form || state.tform || state.prepEdit || state.packEdit || ["prepNew", "prepText", "packNew", "packText"].includes(document.activeElement?.id);

  // ---------- 資料同步 ----------
  function normalize(v) {
    const ex = { 1: [], 2: [], 3: [] };
    if (v) for (const d of Object.keys(ex)) ex[d] = Object.entries(v[d] || {}).map(([id, x]) => ({ ...x, id, tags: Array.isArray(x.tags) ? x.tags : [] }));
    return ex;
  }
  let syncRevision = 0;
  function pull() {
    const revision = ++syncRevision;
    return fetch(DB + ".json").then(r => { if (!r.ok) throw Error(); return r.json(); })
      .then(v => {
        if (state.busy || revision !== syncRevision) return;
        state.extra = normalize(v); state.sync = "cloud";
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); } catch (e) {}
        if (!editing()) render();
      })
      .catch(() => { state.sync = "error"; if (!editing()) render(); });
  }
  function connect() {
    if (!DB) {
      try { const v = JSON.parse(localStorage.getItem(LOCAL_KEY)); if (v) state.extra = { 1: [], 2: [], 3: [], ...v }; } catch (e) {}
      return;
    }
    // 先顯示上次同步的副本，沒網路時新增／取消的行程也還看得到
    try { const v = JSON.parse(localStorage.getItem(CACHE_KEY)); if (v) state.extra = normalize(v); } catch (e) {}
    try {
      const es = new EventSource(DB + ".json"); // Firebase REST streaming
      es.addEventListener("put", pull);
      es.addEventListener("patch", pull);
      es.onerror = () => { state.sync = "error"; if (!editing()) render(); };
    } catch (e) { pull(); }
  }
  async function saveItem(day, item) {
    if (state.busy) return false;
    state.busy = true; ++syncRevision; state.error = "";
    try {
      const updated = state.extra[day].filter(x => String(x.id) !== String(item.id)).concat(item);
      if (DB) {
        const r = await fetch(`${DB}/${day}/${encodeURIComponent(item.id)}.json`, { method: "PUT", body: JSON.stringify(item) });
        if (!r.ok) throw Error("write failed");
      } else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...state.extra, [day]: updated }));
      }
      state.extra[day] = updated;
      state.sync = DB ? "cloud" : "local";
      return true;
    } catch (e) {
      state.error = "儲存失敗，修改尚未同步。請檢查網路後再試。";
      return false;
    } finally { state.busy = false; }
  }

  async function removeItem(day, id) {
    if (state.busy) return false;
    state.busy = true; ++syncRevision; state.error = "";
    try {
      const updated = state.extra[day].filter(x => String(x.id) !== String(id));
      if (DB) {
        const r = await fetch(`${DB}/${day}/${encodeURIComponent(id)}.json`, { method: "DELETE" });
        if (!r.ok) throw Error("delete failed");
      } else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...state.extra, [day]: updated }));
      }
      state.extra[day] = updated;
      return true;
    } catch (e) {
      state.error = "儲存失敗，修改尚未同步。請檢查網路後再試。";
      return false;
    } finally { state.busy = false; }
  }

  // 票券：data.js 為原訂內容，網頁上的調整以 kind: "ticket" 存在同一條 extra 路徑（以票券 id 為 key）
  function tickets() {
    return T.tickets.map(t => {
      const edit = (state.extra[t.day] || []).find(x => x.kind === "ticket" && String(x.id) === t.id);
      return edit ? { ...t, status: edit.status, seat: edit.seat, note: edit.note, edited: true } : t;
    });
  }
  function renderTickets() {
    const all = tickets(), f = state.tform;
    $("ticketTable").innerHTML = Object.keys(T.days).map(day => `<section class="transit-day"><h3>Day ${day}<span>${esc(dayDate(day))}</span></h3>${all.filter(t => t.day === +day).map(t => {
      const [text, cls, icn] = STATUS[t.status] || STATUS.pending, label = ico(icn) + text;
      if (f && f.id === t.id) return `<article class="transit-card"><div class="transit-leg">${esc(t.leg)}</div><div class="transit-meta"><span>${ico(passParts(t).car ? "car" : "train")}${esc(passParts(t).name)}</span><strong>${esc(t.time)}</strong></div>
        <div class="form tform"><div class="types">${Object.entries(STATUS).map(([k, [l, , n]]) => `<button class="${f.status === k ? "on" : ""}" data-tstatus="${k}">${ico(n)}${l}</button>`).join("")}</div>
        <label>座位<input id="tSeat" value="${esc(f.seat)}" placeholder="例如 5 車 12 號"></label>
        <label>備註<input id="tNote" value="${esc(f.note)}" placeholder="預約編號、取車站點…"></label>
        <div class="actions">${t.edited ? `<button class="btn" data-treset>恢復原訂</button>` : ""}<button class="btn" data-tcancel>取消</button><button class="btn primary" data-tsave>儲存</button></div></div></article>`;
      const p = passParts(t);
      return `<article class="pass ${p.car ? "car" : "train"}"><div class="pass-strip"><span>${p.car ? "租車" : "臺鐵"}</span></div><div class="pass-body">
        <div class="pass-head"><b>${esc(p.name)}</b><span class="status ${cls}">${label}</span></div>
        <div class="pass-route"><div><strong>${esc(p.dep)}</strong><span>${esc(p.from)}</span></div><div class="pass-line"><i>${ico(p.car ? "car" : "train")}</i>${p.via ? `<small>經 ${esc(p.via)}</small>` : ""}</div><div class="to">${p.arr ? `<strong>${esc(p.arr)}</strong>` : `<em>以票面為準</em>`}<span>${esc(p.to)}</span></div></div>
        ${t.seat || t.note ? `<div class="pass-foot">${t.seat ? `<div class="seat">💺 ${esc(t.seat)}</div>` : ""}${t.note ? `<small>${esc(t.note)}</small>` : ""}</div>` : ""}
        <div class="chips">${t.spot ? `<button class="chip goto" data-goto="${day}:${esc(t.spot)}">${ico("up")}看行程這一站</button>` : ""}<button class="adjust" data-tadjust="${esc(t.id)}">${ico("pencil")}調整</button>${t.edited ? `<span class="chip">已調整</span>` : ""}</div>
      </div></article>`;
    }).join("")}</section>`).join("");
  }
  // 登機證版面：從 leg「A → B → C」拆出起訖與經過站，從 time 拆出出發／抵達時間
  function passParts(t) {
    const round = t.leg.includes("↔"), stops = t.leg.split(/\s*[→↔]\s*/);
    const times = String(t.time).match(/\d{1,2}:\d{2}/g) || [];
    return {
      car: t.mode.includes("🚗"), name: t.mode.replace(/^\S+\s*/, ""),
      // 「A ↔ B」是從 A 出發繞 B 再回 A
      from: stops[0], to: round ? stops[0] : stops[stops.length - 1],
      via: (round ? stops.slice(1) : stops.slice(1, -1)).join("・"), dep: times[0] || t.time, arr: times[1] || ""
    };
  }
  // 行前待確認：data.js 為初始清單（prep-1、prep-2…），網頁上的勾選／修改／刪除／新增以 kind: "prep" 存在 extra/1
  function prepItems() {
    const saved = (state.extra[1] || []).filter(x => x.kind === "prep");
    const base = T.prep.map((text, i) => ({ id: `prep-${i + 1}`, text, done: false }));
    const all = base.map(b => ({ ...b, ...saved.find(x => x.id === b.id) }))
      .concat(saved.filter(x => x.created && !base.some(b => b.id === x.id)));
    return all.filter(x => !x.deleted).sort((a, b) => a.done - b.done);
  }
  function renderPrep() {
    const items = prepItems(), left = items.filter(x => !x.done).length, draft = $("prepNew")?.value || "";
    $("prep").innerHTML = `<summary>${ico("list")}行前待確認（${left ? `剩 ${left} 項` : "全部完成"}）<small>出發前處理</small></summary>
      <ul class="prep-list">${items.map(x => state.prepEdit === x.id
        ? `<li class="editing"><textarea id="prepText" rows="3">${esc(x.text)}</textarea><div class="actions"><button class="btn" data-pdel="${esc(x.id)}">刪除</button><button class="btn" data-pcancel>取消</button><button class="btn primary" data-psave="${esc(x.id)}">儲存</button></div></li>`
        : `<li class="${x.done ? "done" : ""}"><button class="check" data-pcheck="${esc(x.id)}" aria-pressed="${!!x.done}" aria-label="${x.done ? "改回未完成" : "標記完成"}">${x.done ? ico("check") : ""}</button><span>${esc(x.text)}</span><button class="adjust" data-pedit="${esc(x.id)}" aria-label="修改">${ico("pencil")}</button></li>`).join("")}</ul>
      <div class="prep-add"><input id="prepNew" placeholder="新增一項，例如：確認 iRent 預約" value="${esc(draft)}"><button class="btn primary" data-padd>新增</button></div>`;
  }
  async function savePrep(item) {
    const ok = await saveItem(1, { kind: "prep", ...item });
    if (!ok) alert(state.error);
    return ok;
  }
  // 行李清單：項目兩人共用（kind: "pack" 存 extra/1），打勾只記在這支手機（localStorage）
  const PACK_KEY = T.id + "-packed";
  const packedSet = () => { try { return new Set(JSON.parse(localStorage.getItem(PACK_KEY)) || []); } catch (e) { return new Set(); } };
  function togglePacked(id) {
    const set = packedSet(); set.has(id) ? set.delete(id) : set.add(id);
    try { localStorage.setItem(PACK_KEY, JSON.stringify([...set])); } catch (e) {}
  }
  function packItems() {
    const saved = (state.extra[1] || []).filter(x => x.kind === "pack");
    const base = (T.packing || []).map(([group, text], i) => ({ id: `pack-${i + 1}`, group, text }));
    return base.map(b => ({ ...b, ...saved.find(x => x.id === b.id) }))
      .concat(saved.filter(x => x.created && !base.some(b => b.id === x.id)))
      .filter(x => !x.deleted);
  }
  function renderPack() {
    const items = packItems(), packed = packedSet(), groups = T.packGroups || [];
    const done = items.filter(x => packed.has(x.id)).length, draft = $("packNew")?.value || "", draftGroup = $("packGroup")?.value || groups[groups.length - 1];
    const opts = sel => groups.map(g => `<option${g === sel ? " selected" : ""}>${esc(g)}</option>`).join("");
    const row = x => state.packEdit === x.id
      ? `<li class="editing"><input id="packText" value="${esc(x.text)}"><select id="packTextGroup">${opts(x.group)}</select><div class="actions"><button class="btn" data-kdel="${esc(x.id)}">刪除</button><button class="btn" data-kcancel>取消</button><button class="btn primary" data-ksave="${esc(x.id)}">儲存</button></div></li>`
      : `<li class="${packed.has(x.id) ? "done" : ""}"><button class="check" data-kcheck="${esc(x.id)}" aria-pressed="${packed.has(x.id)}" aria-label="${packed.has(x.id) ? "改回未打包" : "標記已打包"}">${packed.has(x.id) ? ico("check") : ""}</button><span>${esc(x.text)}</span><button class="adjust" data-kedit="${esc(x.id)}" aria-label="修改">${ico("pencil")}</button></li>`;
    $("pack").innerHTML = `<summary>${ico("luggage")}行李清單（已打包 ${done}/${items.length}）<small>勾選只記在本機</small></summary>
      ${groups.map(g => { const list = items.filter(x => (groups.includes(x.group) ? x.group : groups[groups.length - 1]) === g); return list.length ? `<h4 class="pack-group">${esc(g)}</h4><ul class="prep-list">${list.map(row).join("")}</ul>` : ""; }).join("")}
      <div class="prep-add"><select id="packGroup" aria-label="分類">${opts(draftGroup)}</select><input id="packNew" placeholder="新增要帶的東西" value="${esc(draft)}"><button class="btn primary" data-kadd>新增</button></div>`;
  }
  function readTicketForm() {
    if (state.tform && $("tSeat")) state.tform = { ...state.tform, seat: $("tSeat").value, note: $("tNote").value };
  }

  // 固定行程覆寫與新增行程共用既有 extra 路徑；不改動原始行程。
  function dayItems(day, includeCancelled = false) {
    const extra = state.extra[day] || [];
    const base = T.days[day].spots.map(s => {
      const edit = extra.find(x => String(x.id) === s.id && x.kind === "override");
      const item = { ...s, ...edit, id: s.id, custom: false };
      return { ...item, icon: item.type === s.type ? s.icon : ty(item.type).icon, sym: item.type === s.type ? s.sym : undefined, chips: [[edit ? "已調整" : s.tag, ""], ...(item.tags || []).map(t => [t, "hot"])] };
    });
    const mine = extra.filter(c => !["override", "ticket", "prep", "pack"].includes(c.kind)).map(c => ({
      ...c, icon: ty(c.type).icon, q: c.q || c.title, desc: c.desc || "", custom: true,
      chips: [...(c.tag ? [[c.tag, ""]] : []), ...(c.tags || []).map(t => [t, "hot"])]
    }));
    return [...base, ...mine].filter(s => includeCancelled || !s.cancelled).sort((a, b) => hr(a.time) - hr(b.time));
  }
  function missingMeals(items) {
    const times = items.map(s => hr(s.time)).filter(h => h < 99);
    if (!times.length) return [];
    const lo = Math.min(...times), hi = Math.max(...times);
    // 已安排＝該項目用 meals 標明涵蓋這餐，或是美食類且時間區間與用餐時段重疊
    const covers = (s, n, a, b) => (s.meals || []).includes(n) ||
      (s.type === "food" && (([x, y]) => x <= b && y >= a)(span(s.time)));
    return MEALS.filter(([n, a, b]) => lo <= b && hi >= a && !items.some(s => covers(s, n, a, b)));
  }
  function renderRoutes(items) {
    const stops = maps.dayStops(items);
    $("dayRoute").hidden = !stops.length;
    $("dayRoute").href = maps.dayRoute(items);
    $("dayRoute").innerHTML = ico("map") + `查看當天地點路線（${stops.length} 個地點）`;
    $("routeLimit").hidden = stops.length <= 5;
    $("routeLimit").textContent = "手機 Google Maps 可能無法顯示全部中途點；請對照行程卡確認。";
  }
  function previousRouteUrl(previous, current) {
    return maps.directions([previous,current]);
  }

  // ---------- 天氣預報 ----------
  // 資料來源 Open-Meteo（免金鑰、可預報 16 天）；地區與座標在 data.js 的 weather。抓不到時顯示上次存在這台手機的結果
  const WEATHER_KEY = T.id + "-weather";
  const WX = [[[0], "晴", "sun"], [[1, 2], "晴時多雲", "partly"], [[3], "陰", "cloud"], [[45, 48], "有霧", "cloud"],
    [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], "有雨", "rain"], [[95, 96, 99], "雷雨", "storm"]];
  const wx = code => WX.find(([codes]) => codes.includes(code)) || [[], "多雲", "cloud"];
  let weather = null, weatherState = "";
  try { weather = JSON.parse(localStorage.getItem(WEATHER_KEY)); if (weather && weather.version !== 3) weather = null; } catch { }
  // 第 n 天的日期（YYYY-MM-DD）
  function dayISO(n) {
    const [y, m, dd] = T.start.split("-").map(Number), d = new Date(y, m - 1, dd + (+n - 1));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  async function loadWeather() {
    const days = Object.keys(T.weather || {});
    if (!days.length || !navigator.onLine) return;
    if (weather && Date.now() - weather.at < 30 * 60 * 1000) return;
    const [y, m, dd] = T.start.split("-").map(Number);
    if ((new Date(y, m - 1, dd) - now()) / 864e5 > 15) { weatherState = "early"; return renderWeather(); }
    const spots = days.flatMap(n => T.weather[n].map(a => ({ n, ...a })));
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + spots.map(s => s.lat).join(",") + "&longitude=" + spots.map(s => s.lon).join(",") +
      "&hourly=weather_code,temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m&daily=sunset&timezone=Asia%2FTaipei" +
      "&start_date=" + dayISO(days[0]) + "&end_date=" + dayISO(days[days.length - 1]);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      const json = await res.json(), list = Array.isArray(json) ? json : [json], data = {};
      spots.forEach((s, i) => {
        const result = list[i], key = `${dayISO(s.n)}T${s.time}`, k = result.hourly.time.indexOf(key), dk = result.daily.time.indexOf(dayISO(s.n));
        (data[s.n] = data[s.n] || []).push(k < 0 ? null : { code: result.hourly.weather_code[k], temp: result.hourly.temperature_2m[k], feel: result.hourly.apparent_temperature[k],
          hours: result.hourly.time.flatMap((t, j) => t.startsWith(dayISO(s.n)) ? [{time:t.slice(11,16),temp:result.hourly.temperature_2m[j],code:result.hourly.weather_code[j],rain:result.hourly.precipitation_probability[j]}] : []), rain: result.hourly.precipitation_probability[k], wind: result.hourly.wind_speed_10m[k], sunset: s.sunset && dk >= 0 ? String(result.daily.sunset[dk] || "").slice(11, 16) : "" });
      });
      weather = { version: 3, at: Date.now(), data };
      try { localStorage.setItem(WEATHER_KEY, JSON.stringify(weather)); } catch { }
      weatherState = "";
    } catch { weatherState = "fail"; }
    renderWeather();
    if (location.hash.startsWith("#weather/")) renderWeatherDetail();
  }
  function renderWeather() {
    const days = Object.keys(T.weather || {});
    if (!days.length) $("map").hidden = true;
    if (!days.length) return;
    const data = (weather && weather.data) || {};
    const left = $("overview").scrollLeft;
    $("overview").innerHTML = days.flatMap(n => T.weather[n].map((a,i) => {
      const f = data[n]?.[i], [,label,icon] = f ? wx(f.code) : [[],"尚無預報","cloud"];
      return `<a class="weather-mini" href="#weather/${n}/${i}"><small>Day ${n} · ${esc(dayDate(n))} ${esc(a.time)}</small><b>${esc(a.name)}</b><span class="mini-condition">${ico("w-"+icon)} ${label}</span><strong>${weatherNumber(f?.temp)}<small>°C</small></strong><span class="mini-bottom">降雨 ${weatherNumber(f?.rain)}% <span>查看天氣 ›</span></span></a>`;
    })).join("");
    $("overview").scrollLeft = left;
    const at = weather && new Date(weather.at), src = "資料來源 Open-Meteo，出發前再看中央氣象署";
    $("weatherCap").textContent = !at
      ? (weatherState === "early" ? "出發前兩週內會出現預報" : weatherState === "fail" || !navigator.onLine ? "暫時抓不到預報，有網路時會自動更新" : "讀取預報中…")
      : `更新於 ${at.getMonth() + 1}/${at.getDate()} ${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}${weatherState === "fail" ? "（暫時抓不到最新的）" : ""}・${src}`;
  }

  function weatherNumber(value) { return Number.isFinite(value) ? Math.round(value) : "—"; }
  function renderWeatherDetail(route = location.hash.slice(1)) {
    const [,n,i] = route.split("/"), spot = T.weather?.[n]?.[i];
    if (!spot) return false;
    const f = weather?.data?.[n]?.[i], [,label,icon] = f ? wx(f.code) : [[],"尚無預報","cloud"];
    const tips = [];
    if (f?.rain >= 50) tips.push("帶把折傘，留意戶外行程");
    if (f?.feel >= 30) tips.push("記得防曬與補水");
    if (spot.coast && f?.wind >= 25) tips.push("海邊風較強，留意隨身物品");
    $("weatherDetail").innerHTML = `<button class="weather-back" type="button">‹ 返回總覽</button><header><p>Day ${esc(n)} · ${esc(dayDate(n))} · ${esc(spot.time)} 行程預報</p><h1 tabindex="-1">${esc(spot.name)}</h1></header><div class="weather-main">${ico("w-"+icon)}<strong>${weatherNumber(f?.temp)}<small>°C</small></strong><span>${label}</span></div><div class="weather-facts">${[["體感",weatherNumber(f?.feel)+"°C"],["降雨機率",weatherNumber(f?.rain)+"%"],["風速",weatherNumber(f?.wind)+" km/h"],...(spot.sunset ? [["日落",f?.sunset || "—"]] : [])].map(([k,v])=>`<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div><h2>當天逐時預報</h2><div class="weather-hours" tabindex="0" aria-label="左右滑動查看逐時預報">${f?.hours?.length ? f.hours.map(h=>`<div><small>${esc(h.time)}</small>${ico("w-"+wx(h.code)[2])}<b>${weatherNumber(h.temp)}°</b><small>${weatherNumber(h.rain)}%</small></div>`).join("") : "目前尚無逐時資料"}</div><p class="weather-tip">${esc(!f ? "取得預報後會顯示出遊提醒。" : tips.join("；") || "出發前再確認天氣，依實際狀況調整行程。")}</p><small>${esc($("weatherCap").textContent)}</small>`;
    $("weatherDetail").querySelector(".weather-back").onclick = () => history.state?.weatherFromMap ? history.back() : showTab("map", true);
    return true;
  }

  // ---------- 畫面 ----------
  function renderStatic() {
    $("badge").innerHTML = ico("train") + esc(T.badge);
    if (T.cover && T.cover.url) {
      $("cover").style.backgroundImage = `url("${encodeURI(T.cover.url)}")`;
      $("cover").classList.add("has-photo");
      if (T.cover.credit) $("footer").insertAdjacentHTML("afterend", `<p class="credit">封面：${esc(T.cover.credit)}</p>`);
    }
    $("title").innerHTML = T.title;
    $("journalSubtitle").textContent = T.subtitle || "";
    $("journalNote").textContent = T.journalNote || "";
    $("stats").innerHTML = T.stats.map(([i, b, s]) => `<div><span>${ico(i)}</span><b>${b}</b><small>${s}</small></div>`).join("");
    $("ticketTip").innerHTML = T.ticketTip;
    $("ticketNote").innerHTML = T.ticketNote;
    $("prep").open = beforeTrip();
    $("pack").open = false;
    $("stays").innerHTML = T.stays.map(s => `<div class="stay"><span>${ico("bed")}</span><div><small>${s.day}</small><b>${s.name}</b><p>${s.info}</p><a href="${gmap(s.q)}" target="_blank" rel="noopener noreferrer">${ico("pin")}查看地圖</a></div></div>`).join("");
    $("footer").innerHTML = T.footer.map(f => `<div>${f}</div>`).join("");
  }

  function render() {
    const day = state.day, d = T.days[day], items = dayItems(day), f = state.form;
    const today = todayDay(), next = day === today ? nextItem(items) : null;
    $("tabs").innerHTML = Object.keys(T.days).map(n => `<button class="tab${+n === day ? " on" : ""}" data-day="${n}">Day ${n}${+n === today ? "・今天" : ""}</button>`).join("");
    $("route").textContent = `${dayDate(day)} · ${items.length} 段行程`;
    $("dayRoute").hidden = !items.length;
    $("sync").innerHTML = !navigator.onLine && DB ? ico("offline") + "離線中，顯示上次同步的內容"
      : { local: ico("phone") + "只存在這台裝置", connecting: "", cloud: "", error: ico("alert") + "同步失敗，請檢查網路或 Firebase 權限" }[state.sync];
    renderRoutes(items);

    const miss = missingMeals(items);
    $("hints").innerHTML = miss.length ? `<div class="hints"><span>${ico("food")}還沒安排：</span>${miss.map(([n, , , t]) => `<button data-meal="${t}">＋ ${n}</button>`).join("")}</div>` : "";

    $("timeline").innerHTML = items.map((s, index) => `
      <div class="item${next && next.item === s ? " next" : ""}" data-id="${esc(s.id)}"><div class="item-card${s.custom ? " mine" : ""}">
        <div class="icon t-${esc(s.type)}" style="background:${ty(s.type).bg}">${cardIcon(s)}</div>
        <div class="body">
          <div class="row"><span class="time">${ico("clock")}${esc(s.time)}${next && next.item === s ? `<em class="now">${next.label}</em>` : ""}</span><button class="adjust" data-edit="${esc(s.id)}" aria-expanded="${!!f && String(f.id) === String(s.id)}">${ico("pencil")}編輯</button></div>
          <div class="title">${esc(s.title)}</div>
          ${s.desc ? `<p class="desc${state.expanded.has(String(s.id)) ? " open" : ""}" data-desc="${esc(s.id)}">${esc(s.desc)}</p>` : ""}
        </div>
        <div class="card-foot">
          ${s.chips.length ? `<div class="spot-tags">${s.chips.map(([t, c]) => `<span class="chip ${c}">${tagHtml(t)}</span>`).join("")}</div>` : ""}
          <div class="chips spot-actions"><a class="chip nav" href="${esc(maps.resolve(s).url)}" target="_blank" rel="noopener noreferrer">${ico("pin")}查看地圖</a>${goHtml(items, index)}</div>
          ${s.custom ? "" : parkingHtml(s)}
        </div>
      </div>${f && String(f.id) === String(s.id) ? formHtml(day, f) : ""}</div>`).join("") + cancelledHtml(day) + (state.error ? `<p role="alert">${esc(state.error)}</p>` : "") + (f ? (f.id ? "" : formHtml(day, f)) : `<button class="add-btn" data-open>＋ 新增行程（午餐、下午茶、景點…）</button>`);
    // 說明預設只顯示 2 行；被截斷的才加「展開」提示
    document.querySelectorAll(".desc:not(.open)").forEach(p => p.classList.toggle("more", p.scrollHeight > p.clientHeight + 2));
    renderTickets();
    renderPrep();
    renderPack();
  }

  // 導航按鈕：「前往這一站」到景點；有停車場的行程再多一顆「前往停車場」（開車的人按這顆，起點＝手機當下位置）
  function mainLot(s) {
    const p = !s.custom && (T.parking || {})[s.id];
    return p ? (T.parkingLots || {})[p.main] : null;
  }
  function goHtml(items, index) {
    const s = items[index], prev = items[index - 1], lot = mainLot(s);
    const link = (href, title, icon, label) => `<a class="chip nav" href="${esc(href)}" title="${esc(title)}" target="_blank" rel="noopener noreferrer">${ico(icon)}${label}</a>`;
    const toSpot = prev ? link(previousRouteUrl(prev, s), `${prev.title} → ${s.title}`, "go", "前往這一站") : "";
    if (!lot) return toSpot;
    const fromHere = "https://www.google.com/maps/dir/?" + new URLSearchParams({ api: "1", destination: lot.q || lot.name, travelmode: "driving" });
    return toSpot + link(fromHere, `目前位置 → ${lot.name}`, "parking", "前往停車場");
  }

  // 停車資訊：主要停車場＋步行時間（主要停車場的導航在上方「前往停車場」）；展開備用停車場與費用提醒（資料在 data.js 的 parking／parkingLots）
  function parkingHtml(s) {
    const p = (T.parking || {})[s.id], lots = T.parkingLots || {}, main = p && lots[p.main];
    if (!main) return "";
    const nav = (lot, label) => `<a class="chip nav" href="${gmap(lot.q || lot.name)}" target="_blank" rel="noopener noreferrer">${ico("go")}${label}</a>`;
    const walk = m => m ? `步行約 ${esc(m)} 分` : "";
    const lotInfo = (lot, m) => `<p>${[lot.fee, walk(m), lot.info].filter(Boolean).map(esc).join("・")}</p>${lot.warn ? `<p class="park-warn">${ico("alert")}${esc(lot.warn)}</p>` : ""}`;
    const backup = lots[p.backup], backup2 = lots[p.backup2];
    return `<div class="park">
      <div class="park-main">${ico("parking")}<div><b>${esc(main.name)}</b>${p.walk ? `<small>${walk(p.walk)}</small>` : ""}</div></div>
      ${main.warn ? `<p class="park-warn">${ico("alert")}${esc(main.warn)}</p>` : ""}
      <details class="park-more" data-park="${esc(s.id)}"${state.parkOpen.has(String(s.id)) ? " open" : ""}><summary>${backup ? "費用與備用停車場" : "停車費用與提醒"}</summary>
        <div class="park-lot"><small>主要</small>${lotInfo({ ...main, warn: "" }, p.walk)}</div>
        ${backup ? `<div class="park-lot"><small>備案</small><div class="park-main"><div><b>${esc(backup.name)}</b></div>${nav(backup, "導航")}</div>${lotInfo(backup, p.backupWalk)}</div>` : ""}
        ${backup2 ? `<div class="park-lot"><small>再不行</small><div class="park-main"><div><b>${esc(backup2.name)}</b></div>${nav(backup2, "導航")}</div>${lotInfo(backup2)}</div>` : ""}
        ${p.note ? `<p class="park-note">${esc(p.note)}</p>` : ""}
      </details>
    </div>`;
  }

  function cancelledHtml(day) {
    const items = dayItems(day, true).filter(s => s.cancelled);
    return items.length ? `<details class="form"><summary>已取消行程（${items.length}）</summary>${items.map(s => `<p>${esc(s.time)} ${esc(s.title)} <button class="chip" data-restore="${esc(s.id)}">恢復行程</button></p>`).join("")}</details>` : "";
  }
  function formHtml(day, f) {
    return `<div class="form itinerary-form">
      <h3>${f.id ? "編輯行程" : `新增到 Day ${day}`}</h3>
      <div class="types">${Object.entries(TYPES).map(([k, v]) => `<button class="${f.type === k ? "on" : ""}" style="${f.type === k ? `background:${v.bg}` : ""}" data-type="${k}">${ico(TYPE_ICON[k] || "pin")}${esc(v.label.replace(/^\S+\s*/, ""))}</button>`).join("")}</div>
      <div class="form-row"><input aria-label="行程時間" id="fTime" value="${esc(f.time)}" placeholder="12:30"><input aria-label="行程名稱" id="fTitle" value="${esc(f.title)}" placeholder="店名或景點名稱"></div>
      <label>地點名稱、完整地址或座標<input id="fPlace" value="${esc(f.q || "")}" placeholder="例如：高雄市＋店名，或緯度,經度" aria-describedby="placeHelp"></label>
      <label>Google Maps 地點連結（選填）<input id="fMapUrl" type="url" value="${esc(f.mapUrl || "")}" placeholder="貼上 Google Maps 分享連結" aria-describedby="placeHelp"></label>
      <small id="placeHelp">查看地圖會直接開啟連結；若使用短連結，請另填完整地址或座標供路線使用。只填名稱時仍會以名稱搜尋。更換地點時請一併更新或清除連結。</small>
      <button type="button" class="btn" data-map-preview>開地圖確認位置</button>
      <p id="placeError" class="note" role="alert"></p>
      <textarea id="fDesc" rows="2" placeholder="想吃什麼、備註（選填）">${esc(f.desc)}</textarea>
      ${!f.id || f.custom ? `<input id="fTag" value="${esc(f.tag || "")}" placeholder="一句話特色（選填）：在地銅板小吃">` : ""}
      <input id="fTags" value="${esc(f.tags)}" placeholder="標籤，用空格分開：必吃 排隊名店">
      <div class="actions"><button class="btn" data-cancel>放棄修改</button><button class="btn primary" data-add>${f.id ? "儲存修改" : "加入行程"}</button></div>
      <small>會依時間自動排進行程。</small>
      ${f.id ? `<div class="cancel-stop"><button class="btn" data-stop="${esc(f.id)}">取消這站</button><small>取消後仍可從「已取消行程」恢復。</small></div>` : ""}
    </div>`;
  }

  const blank = (time = "") => ({ type: "food", time, title: "", desc: "", tags: "" });
  function readForm() {
    if (!state.form) return;
    state.form = { ...state.form, time: $("fTime").value, title: $("fTitle").value, q: $("fPlace").value, mapUrl: $("fMapUrl").value, desc: $("fDesc").value, tags: $("fTags").value, ...($("fTag") ? { tag: $("fTag").value } : {}) };
  }

  // ---------- 事件 ----------
  document.addEventListener("click", async e => {
    if (e.target.closest("[data-map-preview]")) {
      readForm();
      try {
        const f = state.form, raw = f.mapUrl.trim() || (maps.isUrl(f.q) ? f.q.trim() : "");
        if (raw && !maps.safeUrl(raw)) throw Error("請貼上有效的 Google Maps 地點連結。");
        if (!raw && !f.q.trim() && !f.title.trim()) throw Error("請先填入地點名稱或連結。");
        $("placeError").textContent = "";
        window.open(raw || gmap(f.q.trim() || f.title.trim()), "_blank", "noopener,noreferrer");
      } catch (error) { $("placeError").textContent = error.message; }
      return;
    }
    const descEl = e.target.closest("[data-desc]");
    if (descEl) {
      const id = descEl.dataset.desc;
      state.expanded.has(id) ? state.expanded.delete(id) : state.expanded.add(id);
      descEl.classList.toggle("open"); descEl.classList.toggle("more", !descEl.classList.contains("open") && descEl.scrollHeight > descEl.clientHeight + 2);
      return;
    }
    const kEl = e.target.closest("[data-kcheck],[data-kedit],[data-ksave],[data-kcancel],[data-kdel],[data-kadd]");
    if (kEl) {
      if (state.busy) return;
      const find = id => packItems().find(x => x.id === id), d = kEl.dataset;
      const save = async item => { const ok = await saveItem(1, { kind: "pack", ...item }); if (!ok) alert(state.error); return ok; };
      if (d.kcheck) togglePacked(d.kcheck);
      else if (d.kedit) state.packEdit = d.kedit;
      else if ("kcancel" in d) state.packEdit = null;
      else if (d.ksave) { const text = $("packText").value.trim(); if (text && await save({ ...find(d.ksave), text, group: $("packTextGroup").value })) state.packEdit = null; }
      else if (d.kdel) { if (confirm("確定從清單刪除？兩支手機都會一起刪掉。") && await save({ ...find(d.kdel), deleted: true })) state.packEdit = null; }
      else if ("kadd" in d) {
        const text = $("packNew").value.trim(); if (!text) return $("packNew").focus();
        if (await save({ id: "pack-" + Date.now(), group: $("packGroup").value, text, created: true })) $("packNew").value = "";
      }
      document.activeElement?.blur();
      return renderPack();
    }
    const pEl = e.target.closest("[data-pcheck],[data-pedit],[data-psave],[data-pcancel],[data-pdel],[data-padd]");
    if (pEl) {
      if (state.busy) return;
      const find = id => prepItems().concat((state.extra[1] || []).filter(x => x.kind === "prep")).find(x => x.id === id);
      const d = pEl.dataset;
      if (d.pcheck) { const x = find(d.pcheck); await savePrep({ ...x, done: !x.done }); }
      else if (d.pedit) state.prepEdit = d.pedit;
      else if ("pcancel" in d) state.prepEdit = null;
      else if (d.psave) { const text = $("prepText").value.trim(); if (text && await savePrep({ ...find(d.psave), text })) state.prepEdit = null; }
      else if (d.pdel) { if (confirm("確定刪除這一項？") && await savePrep({ ...find(d.pdel), deleted: true })) state.prepEdit = null; }
      else if ("padd" in d) {
        const text = $("prepNew").value.trim(); if (!text) return $("prepNew").focus();
        if (await savePrep({ id: "prep-" + Date.now(), text, done: false, created: true })) $("prepNew").value = "";
      }
      $("prepNew") && document.activeElement?.blur();
      return renderPrep();
    }
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) return showTab(tabBtn.dataset.tab, true);
    const el = e.target.closest("[data-day],[data-meal],[data-open],[data-cancel],[data-add],[data-type],[data-edit],[data-stop],[data-restore],[data-adjust],[data-goto],[data-tadjust],[data-tstatus],[data-tsave],[data-tcancel],[data-treset]");
    if (!el || state.busy) return;
    const day = state.day;
    if (el.dataset.goto) {
      const [d, id] = el.dataset.goto.split(":");
      state.day = +d; state.form = null; state.adjust = null; render(); showTab("plan", true);
      document.querySelector(`.item[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (el.dataset.tadjust) {
      const t = tickets().find(x => x.id === el.dataset.tadjust);
      state.tform = { id: t.id, day: t.day, status: t.status, seat: t.seat || "", note: t.note || "" }; state.error = "";
      render(); return;
    }
    if (el.dataset.tstatus) { readTicketForm(); state.tform.status = el.dataset.tstatus; render(); return; }
    if ("tcancel" in el.dataset) { state.tform = null; render(); return; }
    if ("tsave" in el.dataset || "treset" in el.dataset) {
      readTicketForm(); const f = state.tform;
      const ok = "treset" in el.dataset ? await removeItem(f.day, f.id)
        : await saveItem(f.day, { id: f.id, kind: "ticket", status: f.status, seat: f.seat.trim(), note: f.note.trim() });
      if (ok) state.tform = null;
      render(); if (!ok) alert(state.error); return;
    }
    if (el.dataset.adjust) state.adjust = state.adjust === el.dataset.adjust ? null : el.dataset.adjust;
    else if (el.dataset.day) { state.day = +el.dataset.day; state.form = null; state.adjust = null; }
    else if (el.dataset.meal) state.form = blank(el.dataset.meal);
    else if ("open" in el.dataset) state.form = blank();
    else if ("cancel" in el.dataset) state.form = null;
    else if (el.dataset.type) { readForm(); state.form.type = el.dataset.type; }
    else if (el.dataset.edit) {
      const item = dayItems(day).find(s => String(s.id) === el.dataset.edit);
      if (!item) return;
      state.form = { ...item, tags: (item.tags || []).join(" ") };
      state.error = "";
    }
    else if ("add" in el.dataset) {
      readForm(); const f = state.form; if (!f.title.trim()) return $("fTitle").focus();
      let locationFields;
      try { locationFields = maps.fields(f.q, f.mapUrl, f.title); }
      catch (error) { $("placeError").textContent = error.message; $("fPlace").focus(); return; }
      const old = f.id ? dayItems(day, true).find(s => String(s.id) === String(f.id)) : null;
      const item = { id: f.id || String(Date.now()), time: f.time.trim() || "未定", title: f.title.trim(), desc: f.desc.trim(), type: f.type,
        ...locationFields, tags: f.tags.split(/[\s,，、]+/).filter(Boolean), cancelled: false,
        ...(old && !old.custom ? { kind: "override" } : { tag: (f.tag || "").trim() }) };
      if (await saveItem(day, item)) state.form = null;
    }
    else if (el.dataset.stop || el.dataset.restore) {
      const id = el.dataset.stop || el.dataset.restore;
      const old = dayItems(day, true).find(s => String(s.id) === id);
      if (!old) return;
      if (el.dataset.stop && !confirm(`確定取消「${old.title}」？未儲存的修改不會保留，之後可從「已取消行程」恢復。`)) return;
      readForm();
      const { chips, custom, ...item } = old;
      if (!custom) item.kind = "override";
      item.cancelled = !!el.dataset.stop;
      if (await saveItem(day, item)) {
        if (state.form && String(state.form.id) === id) state.form = null;
        state.adjust = null;
      }
    }
    render();
    if (state.form) document.querySelector(".itinerary-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ---------- 底部分頁 ----------
  // 一次只顯示一個分頁；網址帶 #分頁，返回鍵可回上一頁。出發前預設「總覽」，旅途中預設「行程」
  const TABS = ["map", "plan", "tickets", "stay"];
  let weatherReturn = null;
  document.addEventListener("click", e => {
    const card = e.target.closest(".weather-mini");
    if (!card) return;
    e.preventDefault();
    weatherReturn = {top:scrollY,left:$("overview").scrollLeft,href:card.getAttribute("href")};
    history.pushState({weatherFromMap:true}, "", card.getAttribute("href"));
    showTab(location.hash.slice(1));
    $("weatherDetail").querySelector("h1")?.focus({preventScroll:true});
  });
  function showTab(tab, push = false) {
    if (tab.startsWith("weather/") && renderWeatherDetail(tab)) {
      document.querySelectorAll("[data-panel]").forEach(el => { el.hidden = el.dataset.panel !== "weather"; });
      document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === "map"));
      scrollTo({top:0,behavior:"instant"});
      return;
    }
    if (!TABS.includes(tab)) tab = todayDay() ? "plan" : "map";
    document.querySelectorAll("[data-panel]").forEach(el => { el.hidden = el.dataset.panel !== tab; });
    document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
    const url = location.pathname + location.search + "#" + tab;
    if (push) history.pushState(null, "", url); else history.replaceState(history.state, "", url);
    scrollTo({ top: tab === "map" && weatherReturn ? weatherReturn.top : 0, behavior: "instant" });
    if (tab === "map" && weatherReturn) {
      $("overview").scrollLeft = weatherReturn.left;
      $("overview").querySelector(`a[href="${weatherReturn.href}"]`)?.focus({preventScroll:true});
    }
  }
  // 停車備案展開狀態：每分鐘重畫時保持展開
  document.addEventListener("toggle", e => { const id = e.target.dataset?.park; if (id) e.target.open ? state.parkOpen.add(id) : state.parkOpen.delete(id); }, true);
  // 新增欄位按 Enter 直接新增
  document.addEventListener("keydown", e => { if (e.key !== "Enter" || e.isComposing) return;
    if (e.target.id === "prepNew") { e.preventDefault(); document.querySelector("[data-padd]").click(); }
    if (e.target.id === "packNew") { e.preventDefault(); document.querySelector("[data-kadd]").click(); } });
  addEventListener("popstate", () => showTab(location.hash.slice(1)));

  // ---------- 離線備份 ----------
  // 列印版：三天行程＋票券＋住宿一次攤開，手機可「列印 → 存成 PDF」
  function renderPrint() {
    const days = Object.keys(T.days).map(n => `<h2>Day ${n}・${esc(dayDate(n))}</h2>${dayItems(n).map(s =>
      `<div class="p-item"><b>${esc(s.time)}</b><div><strong>${esc(s.title)}</strong><p>${esc(s.desc)}</p><small>地點：${esc(s.q || s.title)}</small>${printParking(s)}</div></div>`).join("")}`).join("");
    const ticketRows = tickets().map(t => `<tr><td>Day ${t.day}</td><td>${esc(t.leg)}</td><td>${esc(t.mode)}</td><td>${esc(t.time)}</td><td>${(STATUS[t.status] || STATUS.pending)[0]}${t.seat ? `・${esc(t.seat)}` : ""}</td></tr>`).join("");
    const stays = T.stays.map(s => `<p><b>${esc(s.day)}</b> ${esc(s.name)}・${esc(s.info)}</p>`).join("");
    $("printAll").innerHTML = `<h1>${T.title.replace(/<br>/g, " ")}</h1><p>${esc(T.badge)}</p>${days}<h2>票券</h2><table>${ticketRows}</table><h2>住宿</h2>${stays}`;
  }
  function printParking(s) {
    const p = (T.parking || {})[s.id], lots = T.parkingLots || {};
    if (s.custom || !p || !lots[p.main]) return "";
    const line = (label, lot) => lot ? `<br><small>${label}：${esc(lot.name)}（${esc(lot.fee)}）</small>` : "";
    return line("停車", lots[p.main]) + line("備案", lots[p.backup]);
  }
  addEventListener("beforeprint", renderPrint);
  // iPhone 從主畫面圖示開啟時系統不支援列印：改存一份離線備份網頁檔（分享選單 →「儲存到檔案」）
  const standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  function backupFile() {
    renderPrint();
    const d = new Date(), stamp = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const html = `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(T.title.replace(/<br>/g, " "))} 離線備份</title><style>
body{margin:0;padding:20px 16px 40px;font:15px/1.6 -apple-system,"PingFang TC","Noto Sans TC",sans-serif;color:#222;background:#fff}
h1{font-size:22px;margin:0 0 4px}h2{font-size:18px;margin:24px 0 8px;padding-bottom:4px;border-bottom:1px solid #ccc}
.p-item{display:grid;grid-template-columns:68px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #eee}
.p-item p{margin:2px 0;color:#444}.p-item small{color:#666}.stamp{color:#888;font-size:13px}
table{width:100%;border-collapse:collapse;font-size:14px}td{border-bottom:1px solid #ddd;padding:6px 4px;vertical-align:top}
</style></head><body>${$("printAll").innerHTML}<p class="stamp">備份時間：${stamp}（之後的修改請看網站）</p></body></html>`;
    return new File([html], `旅行備份-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.html`, { type: "text/html" });
  }
  if (standalone) $("printBtn").innerHTML = ico("file") + "存離線備份檔（存到「檔案」）";
  $("printBtn").addEventListener("click", async () => {
    if (!standalone) { renderPrint(); print(); return; }
    const file = backupFile();
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "旅行離線備份" }); } catch (e) { /* 使用者取消分享 */ }
      return;
    }
    // 不支援分享檔案時直接下載
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  });
  addEventListener("online", () => { if (!editing()) render(); if (DB) pull(); loadWeather(); });
  addEventListener("offline", () => { if (!editing()) render(); });
  // Service Worker：開過一次後，沒網路也能打開網頁
  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

  // 網址帶 ?now= 時顯示測試模式提示，避免誤以為是真的日期
  if (nowParam && !isNaN(new Date(nowParam))) {
    const d = new Date(nowParam), bar = document.createElement("div");
    bar.className = "testbar";
    bar.innerHTML = `🧪 測試模式：目前模擬 ${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}<a href="${esc(location.pathname)}">回到現在</a>`;
    document.body.appendChild(bar);
  }

  renderStatic();
  renderWeather();
  loadWeather();
  connect();
  render();
  showTab(location.hash.slice(1));
  // 每分鐘更新「下一站」；正在填表單時不重畫，避免打到一半的字被清掉
  setInterval(() => { if (!editing() && state.day === todayDay()) render(); }, 60000);
})();
