(() => {
  const T = window.TRIP, TYPES = window.TYPES, MEALS = window.MEALS;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hr = t => { const m = String(t).match(/(\d{1,2}):(\d{2})/); return m ? +m[1] + m[2] / 60 : 99; };
  const gmap = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  const LOCAL_KEY = T.id + "-extra";
  const DB = T.dbUrl ? T.dbUrl.replace(/\/+$/, "") + "/" + T.id + "/extra" : "";

  const state = { day: 1, form: null, extra: { 1: [], 2: [], 3: [] }, sync: DB ? "connecting" : "local" };

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
      ...c, icon: TYPES[c.type].icon, q: c.title, desc: c.desc || "自己加的行程", custom: true,
      chips: [["我加的", "mine"], ...c.tags.map(t => [t, "hot"])]
    }));
    return [...base, ...mine].sort((a, b) => hr(a.time) - hr(b.time));
  }
  function missingMeals(items) {
    const times = items.map(s => hr(s.time)).filter(h => h < 99);
    const lo = Math.min(...times), hi = Math.max(...times);
    return MEALS.filter(([, a, b]) => lo <= b && hi >= a &&
      !items.some(s => s.type === "food" && hr(s.time) >= a && hr(s.time) <= b));
  }
  function routeUrl(items, mode) {
    const q = items.map(s => s.q), w = q.slice(1, -1).slice(0, 9); // Google 最多 9 個中途點
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
    $("tabs").innerHTML = Object.keys(T.days).map(n => `<button class="tab${+n === day ? " on" : ""}" data-day="${n}">Day ${n}</button>`).join("");
    $("route").textContent = d.route;
    $("sync").textContent = { local: "📱 只存在這台裝置", connecting: "⏳ 連線中…", cloud: "☁️ 已與 Firebase 即時同步", error: "⚠️ 同步失敗，請檢查網路或 Firebase 權限" }[state.sync];
    $("dayRoute").href = routeUrl(items, d.travelmode);
    $("dayRoute").textContent = `🗺️ 用 Google Maps 開啟 Day ${day} 完整路線`;

    const miss = missingMeals(items);
    $("hints").innerHTML = miss.length ? `<div class="hints"><span>🍽️ 還沒安排：</span>${miss.map(([n, , , t]) => `<button data-meal="${t}">＋ ${n}</button>`).join("")}</div>` : "";

    $("timeline").innerHTML = items.map(s => `
      <div class="item"><div class="item-card${s.custom ? " mine" : ""}">
        <div class="icon" style="background:${TYPES[s.type].bg}">${esc(s.icon)}</div>
        <div class="body">
          <div class="row"><span class="time">⏰ ${esc(s.time)}</span>${s.custom ? `<button class="del" data-del="${s.id}" title="刪除">×</button>` : ""}</div>
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

  renderStatic();
  connect();
  render();
})();
