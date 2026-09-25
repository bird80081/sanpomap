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

  const state = { day: todayDay() || 1, form: null, extra: { 1: [], 2: [], 3: [] }, busy: false, error: "", sync: DB ? "connecting" : "local" };

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
      .then(v => { if (state.busy || revision !== syncRevision) return; state.extra = normalize(v); state.sync = "cloud"; if (!state.form) render(); })
      .catch(() => { state.sync = "error"; if (!state.form) render(); });
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
      es.onerror = () => { state.sync = "error"; if (!state.form) render(); };
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

  // 固定行程覆寫與新增行程共用既有 extra 路徑；不改動原始行程。
  function dayItems(day, includeCancelled = false) {
    const extra = state.extra[day] || [];
    const base = T.days[day].spots.map(s => {
      const edit = extra.find(x => String(x.id) === s.id && x.kind === "override");
      const item = { ...s, ...edit, id: s.id, custom: false };
      return { ...item, icon: item.type === s.type ? s.icon : ty(item.type).icon, chips: [[edit ? "已調整" : s.tag, ""], ...(item.tags || []).map(t => [t, "hot"])] };
    });
    const mine = extra.filter(c => c.kind !== "override").map(c => ({
      ...c, icon: ty(c.type).icon, q: c.q || c.title, desc: c.desc || "", custom: true,
      chips: [["我加的", "mine"], ...(c.tags || []).map(t => [t, "hot"])]
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
  function routeUrl(items, mode) {
    // Google 最多 9 個中途點；大眾運輸模式不支援中途點，只給起訖
    const q = items.filter(s => s.inDayRoute !== false).map(s => s.q), w = mode === "transit" ? [] : q.slice(1, -1).slice(0, 9);
    if (!q.length) return "";
    if (q.length === 1) return gmap(q[0]);
    return "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(q[0]) +
      "&destination=" + encodeURIComponent(q[q.length - 1]) +
      (w.length ? "&waypoints=" + w.map(encodeURIComponent).join("%7C") : "") + "&travelmode=" + mode;
  }

  // 單段路線依畫面排序取上一站；交通方式交由 Google Maps 選擇，避免混合交通日被固定成開車。
  function previousRouteUrl(previous, current) {
    return "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(previous.q || previous.title) +
      "&destination=" + encodeURIComponent(current.q || current.title);
  }

  // ---------- 畫面 ----------
  function renderStatic() {
    $("badge").textContent = T.badge;
    $("title").innerHTML = T.title;
    $("stats").innerHTML = T.stats.map(([i, b, s]) => `<div><span>${i}</span><b>${b}</b><small>${s}</small></div>`).join("");
    $("transitTip").innerHTML = T.transitTip;
    $("transitTable").innerHTML = Object.keys(T.days).map(day => {
      const rows = T.transit.filter(([leg]) => leg.startsWith(`Day${day} `));
      return `<section class="transit-day"><h3>Day ${day}<span>${esc(["10/8", "10/9", "10/10"][day - 1])}</span></h3>${rows.map(([leg, mode, time]) => {
        const note = time.match(/（([^）]+)）/);
        const clock = time.replace(/（[^）]+）/g, "");
        return `<article class="transit-card"><div class="transit-leg">${esc(leg.replace(/^Day\d+\s*/, ""))}</div><div class="transit-meta"><span>${esc(mode)}</span><strong>${esc(clock)}</strong></div>${note ? `<small>${esc(note[1])}</small>` : ""}</article>`;
      }).join("")}</section>`;
    }).join("");
    $("transitNote").innerHTML = T.transitNote;
    $("stays").innerHTML = T.stays.map(s => `<div class="stay"><span>${s.icon}</span><div><small>${s.day}</small><b>${s.name}</b><p>${s.info}</p><a href="${gmap(s.q)}" target="_blank" rel="noopener noreferrer">📍 查看地圖</a></div></div>`).join("");
    $("footer").innerHTML = T.footer.map(f => `<div>${f}</div>`).join("");
  }

  function render() {
    const day = state.day, d = T.days[day], items = dayItems(day), f = state.form;
    const today = todayDay(), next = day === today ? nextItem(items) : null;
    $("tabs").innerHTML = Object.keys(T.days).map(n => `<button class="tab${+n === day ? " on" : ""}" data-day="${n}">Day ${n}${+n === today ? "・今天" : ""}</button>`).join("");
    $("overview").innerHTML = Object.entries(T.days).map(([n, info]) => {
      const list = dayItems(n);
      const labels = list.map(s => s.kind === "override" || s.custom ? s.title : (s.shortLabel || s.title)).filter((name, i, all) => i === 0 || name !== all[i - 1]);
      return `<div class="ov-day" style="--day-soft:${info.soft};--day-color:${info.color}"><div class="ov-heading"><b>Day ${n}</b><span>${esc(["10/8", "10/9", "10/10"][n - 1])} · ${list.length} 段行程</span></div><div class="ov-stops">${labels.map(name => `<span>${esc(name)}</span>`).join("") || "尚無行程"}</div><details><summary>展開時間與行程</summary><ol>${list.map(s => `<li><time>${esc(s.time)}</time><span>${esc(s.title)}</span></li>`).join("")}</ol></details></div>`;
    }).join("");
    $("route").textContent = `${["10/8", "10/9", "10/10"][day - 1]} · ${items.length} 段行程`;
    $("dayRoute").hidden = !items.length;
    $("sync").textContent = { local: "📱 只存在這台裝置", connecting: "", cloud: "", error: "⚠️ 同步失敗，請檢查網路或 Firebase 權限" }[state.sync];
    $("dayRoute").href = routeUrl(items, d.travelmode);
    $("dayRoute").textContent = d.routeLabel || (d.travelmode === "transit"
      ? `🗺️ Google Maps 開啟 Day ${day} 起訖路線` : `🗺️ 用 Google Maps 開啟 Day ${day} 完整路線`);

    const miss = missingMeals(items);
    $("hints").innerHTML = miss.length ? `<div class="hints"><span>🍽️ 還沒安排：</span>${miss.map(([n, , , t]) => `<button data-meal="${t}">＋ ${n}</button>`).join("")}</div>` : "";

    $("timeline").innerHTML = items.map((s, index) => `
      <div class="item${next && next.item === s ? " next" : ""}"><div class="item-card${s.custom ? " mine" : ""}">
        <div class="icon" style="background:${ty(s.type).bg}">${esc(s.icon)}</div>
        <div class="body">
          <div class="row"><span class="time">⏰ ${esc(s.time)}${next && next.item === s ? `<em class="now">${next.label}</em>` : ""}</span></div>
          <div class="title">${esc(s.title)}</div>
          <p class="desc">${esc(s.desc)}</p>
          <div class="chips"><button class="chip" data-edit="${esc(s.id)}">編輯</button><button class="chip" data-stop="${esc(s.id)}">取消行程</button></div>
          <div class="chips">${s.chips.map(([t, c]) => `<span class="chip ${c}">${esc(t)}</span>`).join("")}<a class="chip nav" href="${gmap(s.q)}" target="_blank" rel="noopener noreferrer">📍 查看地點</a>${index > 0 ? `<a class="chip nav" href="${esc(previousRouteUrl(items[index - 1], s))}" title="${esc(items[index - 1].title)} → ${esc(s.title)}" target="_blank" rel="noopener noreferrer">↗ 從上一站前往</a>` : ""}</div>
        </div>
      </div></div>`).join("") + cancelledHtml(day) + (state.error ? `<p role="alert">${esc(state.error)}</p>` : "") + (f ? formHtml(day, f) : `<button class="add-btn" data-open>＋ 新增行程（午餐、下午茶、景點…）</button>`);
  }

  function cancelledHtml(day) {
    const items = dayItems(day, true).filter(s => s.cancelled);
    return items.length ? `<details class="form"><summary>已取消行程（${items.length}）</summary>${items.map(s => `<p>${esc(s.time)} ${esc(s.title)} <button class="chip" data-restore="${esc(s.id)}">恢復行程</button></p>`).join("")}</details>` : "";
  }
  function formHtml(day, f) {
    return `<div class="form">
      <h3>${f.id ? "編輯行程" : `新增到 Day ${day}`}</h3>
      <div class="types">${Object.entries(TYPES).map(([k, v]) => `<button class="${f.type === k ? "on" : ""}" style="${f.type === k ? `background:${v.bg}` : ""}" data-type="${k}">${v.label}</button>`).join("")}</div>
      <div class="form-row"><input aria-label="行程時間" id="fTime" value="${esc(f.time)}" placeholder="12:30"><input aria-label="行程名稱" id="fTitle" value="${esc(f.title)}" placeholder="店名或景點名稱"></div>
      <label>地點名稱或地址（Google Maps）<input id="fPlace" value="${esc(f.q || "")}" placeholder="留空時使用行程名稱"></label>
      <textarea id="fDesc" rows="2" placeholder="想吃什麼、備註（選填）">${esc(f.desc)}</textarea>
      <input id="fTags" value="${esc(f.tags)}" placeholder="標籤，用空格分開：必吃 排隊名店">
      <div class="actions"><button class="btn" data-cancel>取消</button><button class="btn primary" data-add>${f.id ? "儲存修改" : "加入行程"}</button></div>
      <small>會依時間自動排進行程。</small>
    </div>`;
  }

  const blank = (time = "") => ({ type: "food", time, title: "", desc: "", tags: "" });
  function readForm() {
    if (!state.form) return;
    state.form = { ...state.form, time: $("fTime").value, title: $("fTitle").value, q: $("fPlace").value, desc: $("fDesc").value, tags: $("fTags").value };
  }

  // ---------- 事件 ----------
  document.addEventListener("click", async e => {
    const el = e.target.closest("[data-day],[data-meal],[data-open],[data-cancel],[data-add],[data-type],[data-edit],[data-stop],[data-restore]");
    if (!el || state.busy) return;
    const day = state.day;
    if (el.dataset.day) { state.day = +el.dataset.day; state.form = null; }
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
      const old = f.id ? dayItems(day, true).find(s => String(s.id) === String(f.id)) : null;
      const item = { id: f.id || String(Date.now()), time: f.time.trim() || "未定", title: f.title.trim(), desc: f.desc.trim(), type: f.type,
        q: f.q.trim() || f.title.trim(), tags: f.tags.split(/[\s,，、]+/).filter(Boolean), cancelled: false,
        ...(old && !old.custom ? { kind: "override" } : {}) };
      if (await saveItem(day, item)) state.form = null;
    }
    else if (el.dataset.stop || el.dataset.restore) {
      const id = el.dataset.stop || el.dataset.restore;
      const old = dayItems(day, true).find(s => String(s.id) === id);
      if (!old) return;
      readForm();
      const { chips, custom, ...item } = old;
      if (!custom) item.kind = "override";
      item.cancelled = !!el.dataset.stop;
      if (await saveItem(day, item)) {
        if (state.form && String(state.form.id) === id) state.form = null;
      }
    }
    render();
    if (state.form) document.querySelector(".form:last-child")?.scrollIntoView({ behavior: "smooth", block: "center" });
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
