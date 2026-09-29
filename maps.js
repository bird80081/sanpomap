/* Shared map locations: direct links are separate from routing locations. No remote resolver. */
(function (root) {
  const search = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  const isUrl = v => /^(?:[a-z][\w+.-]*:|\/\/|(?:www\.|maps\.))/i.test(String(v).trim());
  function safeUrl(value) {
    try {
      const u = new URL(String(value).trim());
      if (u.protocol !== 'https:' || u.username || u.password || u.port) return '';
      const h = u.hostname;
      if (h === 'maps.app.goo.gl' || (h === 'goo.gl' && u.pathname.startsWith('/maps/'))) return u.href;
      if ((h === 'www.google.com' || h === 'www.google.com.tw' || h === 'google.com' || h === 'google.com.tw') && /^\/maps(?:\/|$)/.test(u.pathname)) return u.href;
      if (h === 'maps.google.com' || h === 'maps.google.com.tw') return u.href;
    } catch (_) {}
    return '';
  }
  function coords(v) {
    const m = String(v).trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    return m && Math.abs(+m[1]) <= 90 && Math.abs(+m[2]) <= 180 ? `${+m[1]},${+m[2]}` : '';
  }
  function parse(value) {
    const url = safeUrl(value);
    if (!url) return {url:'', query:'', placeId:''};
    const u = new URL(url), p = u.searchParams;
    // A directions URL describes several places, not a single destination selection.
    if (/\/dir(?:\/|$)/.test(u.pathname) || p.has('destination') || p.has('saddr') || p.has('daddr')) return {url, query:'', placeId:'', route:true};
    let query = p.get('query') || p.get('q') || '', placeId = p.get('query_place_id') || '';
    if (query.startsWith('place_id:')) { placeId = query.slice(9); query = ''; }
    let decoded = ''; try { decoded = decodeURIComponent(u.pathname); } catch (_) {}
    // !3d/!4d is the selected pin; @lat,lng is only the viewport, never use it.
    const pin = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (pin) query = coords(pin[1] + ',' + pin[2]) || query;
    if (isUrl(query)) query = '';
    if (!/^[A-Za-z0-9_-]{5,256}$/.test(placeId)) placeId = '';
    return {url, query, placeId};
  }
  function resolve(s) {
    const raw = String(s.q || '').trim(), parsed = parse(s.mapUrl || (isUrl(raw) ? raw : ''));
    const query = parsed.query || (!isUrl(raw) ? raw : '') || String(s.title || '').trim();
    return {query, placeId:parsed.placeId, url:parsed.url || search(query)};
  }
  function fields(q, mapUrl, title) {
    q = String(q || '').trim(); mapUrl = String(mapUrl || '').trim();
    if (isUrl(q)) { if (mapUrl && mapUrl !== q) throw Error('請把地圖網址放在連結欄，位置欄填地址或座標。'); mapUrl = q; q = ''; }
    const p = parse(mapUrl);
    if (mapUrl && !p.url) throw Error('請貼上 https:// 開頭的 Google Maps 地點連結。');
    if (p.route) throw Error('這是多站路線連結，請改貼單一地點的分享連結。');
    if (mapUrl && !p.query && !q) throw Error('請補上完整地址或座標，讓這一站也能加入當天路線。');
    if (/^-?\d+(?:\.\d+)?\s*,/.test(q) && !coords(q)) throw Error('座標格式請使用「緯度,經度」，例如 25.0478,121.5170。');
    return {q:p.query || q || title.trim(), mapUrl:p.url};
  }
  function directions(items, mode) {
    const places = items.map(resolve);
    if (!places.length) return '';
    if (places.length === 1) return places[0].url;
    const p = new URLSearchParams({api:'1'});
    for (const [key, s] of [['origin',places[0]],['destination',places.at(-1)]]) {
      p.set(key,s.query); if (s.placeId) p.set(key+'_place_id',s.placeId);
    }
    const mid = places.slice(1,-1);
    if (mid.length) {
      p.set('waypoints',mid.map(s=>s.query).join('|'));
      if (mid.every(s=>s.placeId)) p.set('waypoint_place_ids',mid.map(s=>s.placeId).join('|'));
    }
    if (['driving','walking','bicycling','transit'].includes(mode)) p.set('travelmode',mode);
    return 'https://www.google.com/maps/dir/?'+p;
  }
  function segments(items, mode) {
    const stops = items.filter(s=>s.inDayRoute !== false), out = [], step = mode === 'transit' ? 1 : 4;
    if (stops.length === 1) return [{items:stops,url:directions(stops,mode)}];
    for(let i=0;i<stops.length-1;i+=step) {
      let part = stops.slice(i,i+step+1);
      // Do not lose a place ID in a mixed waypoint list: make that pin a segment endpoint.
      const mixed = part.slice(1,-1).map(resolve);
      const split = mixed.some(s=>s.placeId) && !mixed.every(s=>s.placeId) ? mixed.findIndex(s=>s.placeId)+1 : 0;
      if(split) part=part.slice(0,split+1);
      while(directions(part,mode).length>2000 && part.length>2) part=part.slice(0,-1);
      out.push({items:part,url:directions(part,mode)});
      i += part.length-1-step;
    }
    return out;
  }
  const api = {safeUrl,parse,resolve,fields,directions,segments,isUrl};
  if(typeof module !== 'undefined') module.exports=api; else root.TripMaps=api;
})(typeof window === 'undefined' ? this : window);
