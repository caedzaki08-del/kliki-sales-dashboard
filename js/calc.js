// Kiraan sahaja (tiada DOM) supaya boleh diuji dengan Node.
(function (root) {
  const FIELDS = ['sales', 'phone', 'repair', 'ipUsed', 'ipNew', 'android', 'ccti', 'acc', 'cctiRecv'];

  function dim(ym) { const p = ym.split('-').map(Number); return new Date(p[0], p[1], 0).getDate(); }
  function dayOf(d) { return +d.slice(8, 10); }

  function sumRows(rows) {
    const o = {}; FIELDS.forEach(f => (o[f] = 0));
    rows.forEach(r => FIELDS.forEach(f => (o[f] += +r[f] || 0)));
    return o;
  }

  function monthRows(data, ym) { return data.filter(r => r.d.slice(0, 7) === ym); }

  function lastDataDay(rows) {
    let l = 0;
    rows.forEach(r => { if ((+r.sales || 0) > 0) l = Math.max(l, dayOf(r.d)); });
    return l;
  }

  function getTargets(C) {
    const m = C.monthly, w = C.phoneWeights;
    const tw = w.ipUsed + w.android + w.ccti + w.ipNew;
    return {
      sales: m.total, repair: m.repair, phone: m.phone, acc: m.accessories, cctiRecv: m.cctiReceived,
      ipUsed: m.phone * w.ipUsed / tw, android: m.phone * w.android / tw,
      ccti: m.phone * w.ccti / tw, ipNew: m.phone * w.ipNew / tw
    };
  }

  function weekShares(C, ym) {
    return ym >= C.weekShares.from ? C.weekShares.split : [0.25, 0.25, 0.25, 0.25];
  }

  function scale(t, k) { const o = {}; Object.keys(t).forEach(x => (o[x] = t[x] * k)); return o; }

  function weekRows(rows, ym, w, C) {
    const a = C.weekRanges[w][0];
    const b = w === 3 ? dim(ym) : C.weekRanges[w][1];
    return rows.filter(r => { const d = dayOf(r.d); return d >= a && d <= b; });
  }

  // Minggu semasa = minggu bagi hari data terakhir
  function weekOfDay(day, C) {
    for (let i = 0; i < 3; i++) if (day <= C.weekRanges[i][1]) return i;
    return 3;
  }

  function cumulative(rows, ym) {
    const n = dim(ym), out = []; let run = 0;
    const byDay = {};
    rows.forEach(r => { byDay[dayOf(r.d)] = (byDay[dayOf(r.d)] || 0) + (+r.sales || 0); });
    const last = lastDataDay(rows);
    for (let d = 1; d <= n; d++) { if (d <= last) { run += byDay[d] || 0; out.push(run); } else out.push(null); }
    return out;
  }

  // Lajur ikut susunan paparan: [key, label, level] level: 0 = bold, 1 = sub (italic)
  const ROWS = [
    ['sales', 'TOTAL SALES', 0, 'rm'],
    ['repair', 'Repair', 0, 'rm'],
    ['phone', 'Phone', 0, 'rm'],
    ['ipNew', 'Apple New', 1, 'rm'],
    ['ipUsed', 'Apple Used', 1, 'rm'],
    ['android', 'Android New', 1, 'rm'],
    ['ccti', 'CCTI Sold', 1, 'rm'],
    ['acc', 'Accessories', 0, 'rm'],
    ['cctiRecv', 'CCTI Received', 0, 'unit']
  ];

  const api = { FIELDS, ROWS, dim, dayOf, sumRows, monthRows, lastDataDay, getTargets, weekShares, scale, weekRows, weekOfDay, cumulative };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KlikiCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
