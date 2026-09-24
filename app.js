(() => {
  const T = window.TRIP, TYPES = window.TYPES, MEALS = window.MEALS;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hr = t => { const m = String(t).match(/(\d{1,2}):(\d{2})/); return m ? +m[1] + m[2] / 60 : 99; };
  // 時間區間：取第一個與最後一個 HH:MM，例如 "10:30–14:20" → [10.5, 14.33]
  const span = t => { const m = [...String(t).matchAll(/(\d{1,2}):(\d{2})/g)].map(x => +x[1] + x[2] / 60); return m.length ? [m[0], m[m.length - 1]] : [99, 99]; };
  const ty = t => TYPES[t] || TYPES.sight; // 雲端資料若出現未知類型，不讓畫面壞掉
  const gmap = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  const LOCAL_KEY = T.id + "-extra";
  const DB = T.dbUrl ? T.dbUrl.replace(/\/+$/, "") + "/" + T.id + "/extra" : "";

  // ---------- 今天模式 ----------
  // 網址加 ?now=2026-10-09T15:00 可模擬旅途中的某個時間（測試用）
  const nowParam = new URLSearchParams(location.search).get("now");
  const now = () => (nowParam && !isNaN(new Date(nowParam)) ? new Date(nowParam) : new Date());
  function todayDay() {
    if (!T.start) return 0;
    const [y, m, dd] = T.start.split("-").map(Number), n = now();
    const diff = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(y, m - 1, dd)) / 864e5) + 1;
    return T.days[diff] ? diff : 0;
  }
  // 當天第一個還沒結束的項目：已開始＝進行中，未開始＝下一站
  function nextItem(items) {
    const n = now(), h = n.getHours() + n.getMinutes() / 60;
    const s = items.find(x => hr(x.time) < 99 && span(x.time)[1] >= h);
    return s ? { item: s, label: hr(s.time) <= h ? "⏳ 進行中" : "👉 下一站" } : null;
  }

  const state = { day: todayDay() || 1, form: null, extra: { 1: [], 2: [], 3: [] }, sync: DB ? "connecting" : "local" };

  // ---------- 資料同步 ----------
  function normalize(v) {
    const ex = { 1: [], 2: [], 3: [] };
    if (v) for (const d of Object.keys(ex)) ex[d] = Object.values(v[d] || {}).map(x => ({ ...x, tags: x.tags || [] }));
    return ex;
  }
  function pull() {
    return fetch(DB + ".json").then(r => r.json())
      .then(v => { state.extra = normalize(v); state.sync = "cloud"; render(); })
      .catch(() => { state.sync = "error"; render(); });
  }
  function connect() {
    if (!DB) {
      try { const v = JSON.parse(localStorage.getItem(LOCAL_KEY)); if (v) state.extra = { 1: [], 2: [], 3: [], ...v }; } catch (e) {}
      return;
    }
    try {
      const es = new EventSource(DB + ".json"); // Firebase REST streaming
      es.addEventListener("put", pull);
      es.addEventListener("patch", pull);
      es.onerror = () => { state.sync = "error"; render(); };
    } catch (e) { pull(); }
  }
  function remote(day, id, item) {
    if (!DB) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state.extra)); } catch (e) {} return; }
    fetch(`${DB}/${day}/${id}.json`, item ? { method: "PUT", body: JSON.stringify(item) } : { method: "DELETE" })
      .catch(() => { state.sync = "error"; render(); });
  }

  // ---------- 行程計算 ----------
  function dayItems(day) {
    const base = T.days[day].spots.map(s => ({ ...s, custom: false, chips: [[s.tag, ""]] }));
    const mine = (state.extra[day] || []).map(c => ({
      ...c, icon: ty(c.type).icon, q: c.title, desc: c.desc || "自己加的行程", custom: true,
      chips: [["我加的", "mine"], ...c.tags.map(t => [t, "hot"])]
    }));
    return [...base, ...mine].sort((a, b) => hr(a.time) - hr(b.time));
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
  function routeUrl(items, mode) {
    // Google 最多 9 個中途點；大眾運輸模式不支援中途點，只給起訖
    const q = items.filter(s => s.inDayRoute !== false).map(s => s.q), w = mode === "transit" ? [] : q.slice(1, -1).slice(0, 9);
    return "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(q[0]) +
      "&destination=" + encodeURIComponent(q[q.length - 1]) +
      (w.length ? "&waypoints=" + w.map(encodeURIComponent).join("%7C") : "") + "&travelmode=" + mode;
  }

  // ---------- 畫面 ----------
  function renderStatic() {
    $("badge").textContent = T.badge;
    $("title").innerHTML = T.title;
    $("stats").innerHTML = T.stats.map(([i, b, s]) => `<div><span>${i}</span><b>${b}</b><small>${s}</small></div>`).join("");
    $("overview").innerHTML = Object.entries(T.days).map(([n, d]) =>
      `<div class="ov-row" style="background:${d.soft};margin-bottom:10px"><b style="background:${d.color}">Day ${n}</b><span>${d.overview}</span></div>`).join("");
    $("transitTip").innerHTML = T.transitTip;
    $("transitTable").innerHTML = `<div class="tr th"><span>路段</span><span>交通</span><span>時間</span></div>` +
      T.transit.map(([l, m, t]) => `<div class="tr"><span class="leg">${l}</span><span class="mode">${m}</span><span class="t">${t}</span></div>`).join("");
    $("transitNote").innerHTML = T.transitNote;
    $("stays").innerHTML = T.stays.map(s => `<div class="stay"><span>${s.icon}</span><div><small>${s.day}</small><b>${s.name}</b><p>${s.info}</p><a href="${gmap(s.q)}" target="_blank" rel="noopener noreferrer">📍 查看地圖</a></div></div>`).join("");
    $("footer").innerHTML = T.footer.map(f => `<div>${f}</div>`).join("");
  }

  function render() {
    const day = state.day, d = T.days[day], items = dayItems(day), f = state.form;
    const today = todayDay(), next = day === today ? nextItem(items) : null;
    $("tabs").innerHTML = Object.keys(T.days).map(n => `<button class="tab${+n === day ? " on" : ""}" data-day="${n}">Day ${n}${+n === today ? "・今天" : ""}</button>`).join("");
    $("route").textContent = d.route;
    $("sync").textContent = { local: "📱 只存在這台裝置", connecting: "", cloud: "", error: "⚠️ 同步失敗，請檢查網路或 Firebase 權限" }[state.sync];
    $("dayRoute").href = routeUrl(items, d.travelmode);
    $("dayRoute").textContent = d.routeLabel || (d.travelmode === "transit"
      ? `🗺️ Google Maps 開啟 Day ${day} 起訖路線` : `🗺️ 用 Google Maps 開啟 Day ${day} 完整路線`);

    const miss = missingMeals(items);
    $("hints").innerHTML = miss.length ? `<div class="hints"><span>🍽️ 還沒安排：</span>${miss.map(([n, , , t]) => `<button data-meal="${t}">＋ ${n}</button>`).join("")}</div>` : "";

    $("timeline").innerHTML = items.map(s => `
      <div class="item${next && next.item === s ? " next" : ""}"><div class="item-card${s.custom ? " mine" : ""}">
        <div class="icon" style="background:${ty(s.type).bg}">${esc(s.icon)}</div>
        <div class="body">
          <div class="row"><span class="time">⏰ ${esc(s.time)}${next && next.item === s ? `<em class="now">${next.label}</em>` : ""}</span>${s.custom ? `<button class="del" data-del="${s.id}" title="刪除">×</button>` : ""}</div>
          <div class="title">${esc(s.title)}</div>
          <p class="desc">${esc(s.desc)}</p>
          <div class="chips">${s.chips.map(([t, c]) => `<span class="chip ${c}">${esc(t)}</span>`).join("")}<a class="chip nav" href="${gmap(s.q)}" target="_blank" rel="noopener noreferrer">📍 開啟導航</a></div>
        </div>
      </div></div>`).join("") + (f ? formHtml(day, f) : `<button class="add-btn" data-open>＋ 新增行程（午餐、下午茶、景點…）</button>`);
  }

  function formHtml(day, f) {
    return `<div class="form">
      <h3>新增到 Day ${day}</h3>
      <div class="types">${Object.entries(TYPES).map(([k, v]) => `<button class="${f.type === k ? "on" : ""}" style="${f.type === k ? `background:${v.bg}` : ""}" data-type="${k}">${v.label}</button>`).join("")}</div>
      <div class="form-row"><input id="fTime" value="${esc(f.time)}" placeholder="12:30"><input id="fTitle" value="${esc(f.title)}" placeholder="店名或景點名稱"></div>
      <textarea id="fDesc" rows="2" placeholder="想吃什麼、備註（選填）">${esc(f.desc)}</textarea>
      <input id="fTags" value="${esc(f.tags)}" placeholder="標籤，用空格分開：必吃 排隊名店">
      <div class="actions"><button class="btn" data-cancel>取消</button><button class="btn primary" data-add>加入行程</button></div>
      <small>會依時間自動排進行程。</small>
    </div>`;
  }

  const blank = (time = "") => ({ type: "food", time, title: "", desc: "", tags: "" });
  function readForm() {
    if (!state.form) return;
    state.form = { ...state.form, time: $("fTime").value, title: $("fTitle").value, desc: $("fDesc").value, tags: $("fTags").value };
  }

  // ---------- 事件 ----------
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-day],[data-meal],[data-open],[data-cancel],[data-add],[data-type],[data-del]");
    if (!el) return;
    const day = state.day;
    if (el.dataset.day) { state.day = +el.dataset.day; state.form = null; }
    else if (el.dataset.meal) state.form = blank(el.dataset.meal);
    else if ("open" in el.dataset) state.form = blank();
    else if ("cancel" in el.dataset) state.form = null;
    else if (el.dataset.type) { readForm(); state.form.type = el.dataset.type; }
    else if ("add" in el.dataset) {
      readForm(); const f = state.form; if (!f.title.trim()) return $("fTitle").focus();
      const item = { id: Date.now(), time: f.time.trim() || "未定", title: f.title.trim(), desc: f.desc.trim(), type: f.type,
        tags: f.tags.split(/[\s,，、]+/).filter(Boolean) };
      state.extra[day] = [...state.extra[day], item]; state.form = null; remote(day, item.id, item);
    }
    else if (el.dataset.del) {
      const id = +el.dataset.del; state.extra[day] = state.extra[day].filter(x => x.id !== id); remote(day, id, null);
    }
    render();
  });

  // ---------- 捲動後固定在上方的導覽列 ----------
  function initNav() {
    const bar = $("stickynav"), links = $("stickylinks");
    links.innerHTML = $("quicknav").innerHTML;
    const secs = [...links.querySelectorAll("a")].map(a => [a, document.querySelector(a.getAttribute("href"))]);
    new IntersectionObserver(([e]) => bar.classList.toggle("show", !e.isIntersecting)).observe($("quicknav"));
    const mark = () => {
      let cur = null;
      for (const [a, sec] of secs) if (sec.getBoundingClientRect().top <= 90) cur = a;
      secs.forEach(([a]) => a.classList.toggle("on", a === cur));
    };
    addEventListener("scroll", mark, { passive: true }); mark();
  }

  renderStatic();
  connect();
  render();
  initNav();
  // 旅行當天：一打開就捲到行程（網址帶 #錨點 時尊重使用者指定的位置）
  if (todayDay() && !location.hash) addEventListener("load", () => scrollTo({ top: $("plan").getBoundingClientRect().top + scrollY - 68, behavior: "instant" }));
  // 每分鐘更新「下一站」；正在填表單時不重畫，避免打到一半的字被清掉
  setInterval(() => { if (!state.form && state.day === todayDay()) render(); }, 60000);
})();
