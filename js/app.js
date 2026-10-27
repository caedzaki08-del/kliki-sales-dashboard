(function () {
  'use strict';
  const C = window.KLIKI_CONFIG, K = window.KlikiCalc;
  const $ = s => document.querySelector(s);
  const LS_PIN = 'kliki_sales_pin', LS_DATA = 'kliki_sales_cache_v1';
  const MONTHS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const state = { data: [], ym: null, tab: 'overview', week: null, weekYm: null, updated: null };

  /* ---------- helpers ---------- */
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const rm = n => 'RM' + nf.format(Math.round(n));
  const un = n => nf.format(Math.round(n));
  const pct = (a, t) => (t > 0 ? Math.round((a / t) * 100) : 0);
  const kfmt = v => (v >= 1000 ? 'RM' + Math.round(v / 1000) + 'k' : 'RM' + Math.round(v));
  const ymLabel = ym => MONTHS[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4);
  const shortDate = (ym, d) => d + '/' + ym.slice(5);
  const sdWord = (diff, f) => diff >= 0
    ? `<span class="chip good">Surplus ${f(Math.abs(diff))}</span>`
    : `<span class="chip bad">Deficit ${f(Math.abs(diff))}</span>`;

  function ctx() {
    const rows = K.monthRows(state.data, state.ym);
    return { rows, last: K.lastDataDay(rows), n: K.dim(state.ym), act: K.sumRows(rows), tg: K.getTargets(C) };
  }

  /* ---------- building blocks ---------- */
  function ring(p, cls) {
    const R = 40, L = 2 * Math.PI * R, v = Math.max(0, Math.min(p, 100)) / 100 * L;
    return `<div class="ring ${cls || ''}"><svg viewBox="0 0 100 100"><circle class="t" cx="50" cy="50" r="${R}"/>` +
      `<circle class="v" cx="50" cy="50" r="${R}" stroke-dasharray="${v} ${L}"/></svg><b>${p}%</b></div>`;
  }

  function table(act, tg, khasT) {
    let h = '<div class="table-scroll"><table class="vs"><thead><tr><th>Item</th><th>Actual</th><th>Target</th><th>Surplus / Deficit</th></tr></thead><tbody>';
    const line = (label, lvl, a, t, f, cls) => {
      const diff = a - t;
      return `<tr class="l${lvl}${cls || ''}"><td>${label}<small class="pc">${pct(a, t)}%</small></td><td>${f(a)}</td><td>${f(t)}</td>` +
        `<td class="sd ${diff >= 0 ? 'good' : 'bad'}">${diff >= 0 ? '+' : '−'}${f(Math.abs(diff))}</td></tr>`;
    };
    K.ROWS.forEach(r => {
      const k = r[0], label = r[1], lvl = r[2], f = r[3] === 'unit' ? un : rm;
      h += line(label + (r[3] === 'unit' ? ' (unit)' : ''), lvl, act[k] || 0, tg[k] || 0, f, k === 'sales' ? ' total' : '');
      if (k === 'sales' && khasT) h += line('vs TARGET KHAS', 1, act.sales || 0, khasT, rm);
    });
    return h + '</tbody></table></div>';
  }

  function lineChart(cum, n, lines) {
    const W = 340, H = 170, l = 46, r = 8, t = 10, b = 22;
    const vals = cum.filter(v => v != null);
    const maxV = Math.max.apply(null, lines.map(x => x.v).concat(vals, [1])) * 1.06;
    const X = d => l + (W - l - r) * (d - 1) / Math.max(n - 1, 1);
    const Y = v => t + (H - t - b) * (1 - v / maxV);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative sales vs target">`;
    for (let i = 0; i <= 4; i++) {
      const v = maxV * i / 4, y = Y(v);
      s += `<line x1="${l}" x2="${W - r}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.1)"/><text x="${l - 6}" y="${y + 3}" text-anchor="end">${kfmt(v)}</text>`;
    }
    [1, 10, 20, n].forEach(d => { s += `<text x="${X(d)}" y="${H - 6}" text-anchor="middle">${d}</text>`; });
    lines.forEach(x => {
      s += `<line x1="${X(1)}" y1="${Y(x.v / n)}" x2="${X(n)}" y2="${Y(x.v)}" stroke="${x.color}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    });
    const pts = [];
    cum.forEach((v, i) => { if (v != null) pts.push(`${X(i + 1).toFixed(1)},${Y(v).toFixed(1)}`); });
    if (pts.length) {
      const lastP = pts[pts.length - 1].split(',');
      s += `<polyline fill="none" stroke="#6FA3FF" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" points="${pts.join(' ')}"/>` +
        `<circle cx="${lastP[0]}" cy="${lastP[1]}" r="4" fill="#fff"/>`;
    }
    return s + '</svg>';
  }

  function barChart(items) {
    const W = 340, H = 180, l = 8, r = 8, t = 22, b = 26;
    const maxV = Math.max.apply(null, items.map(i => Math.max(i.t, i.a || 0)).concat([1])) * 1.05;
    const gw = (W - l - r) / items.length, bw = Math.min(gw * 0.3, 34);
    const Y = v => t + (H - t - b) * (1 - v / maxV);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly actual vs target">`;
    items.forEach((it, i) => {
      const cx = l + gw * i + gw / 2;
      s += `<rect x="${cx - bw - 2}" y="${Y(it.t)}" width="${bw}" height="${H - b - Y(it.t)}" rx="4" fill="rgba(255,255,255,.28)"/>`;
      if (it.a != null) {
        const col = it.a >= it.t ? '#34D399' : '#6FA3FF';
        s += `<rect x="${cx + 2}" y="${Y(it.a)}" width="${bw}" height="${Math.max(H - b - Y(it.a), 1)}" rx="4" fill="${col}"/>` +
          `<text x="${cx + 2 + bw / 2}" y="${Y(it.a) - 5}" text-anchor="middle" style="fill:#fff;font-weight:700">${kfmt(it.a)}</text>`;
      }
      s += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${it.label}</text>`;
    });
    return s + '</svg>';
  }

  const empty = (t, d) => `<div class="empty"><b>${t}</b>${d}</div>`;

  // Kad cincin setiap kategori: warna ikut kadar semasa (hijau = atas pace, kuning = dalam 85%, merah = bawah)
  function catRings(act, tg, last, n) {
    const tile = r => {
      const k = r[0], isUnit = r[3] === 'unit', f = isUnit ? un : rm;
      const a = act[k] || 0, t = tg[k] || 0, pace = t * last / n;
      const cls = a >= pace ? 'good' : a >= pace * 0.85 ? 'warn' : 'bad';
      return `<div class="tile center">${ring(pct(a, t), cls)}<div class="lbl">${r[1]}</div>` +
        `<div class="small">${f(a)} / ${f(t)}${isUnit ? ' unit' : ''}</div>` +
        `<div style="margin-top:8px">${sdWord(a - t, f)}</div></div>`;
    };
    const by = k => K.ROWS.find(r => r[0] === k);
    const main = ['phone', 'repair', 'acc', 'cctiRecv'].map(by).map(tile).join('');
    const sub = ['ipUsed', 'android', 'ccti', 'ipNew'].map(by).map(tile).join('');
    return `<section class="card flat"><div class="eyebrow">Kategori · vs target bulanan</div><div class="grid2">${main}</div></section>` +
      `<section class="card flat"><div class="eyebrow">Phone · pecahan kategori</div><div class="grid2">${sub}</div>` +
      `<p class="note">Cincin hijau = atas kadar semasa, kuning = dalam 85% kadar, merah = bawah. Surplus/Deficit dibanding target bulanan penuh.</p></section>`;
  }

  /* ---------- views ---------- */
  function viewOverview() {
    const c = ctx();
    if (!c.last) return empty('Tiada data jualan', 'Belum ada rekod untuk ' + ymLabel(state.ym) + '.');
    const { act, tg, last, n } = c;
    const khas = C.targetKhas[state.ym];
    const pace = tg.sales * last / n;
    const p = pct(act.sales, tg.sales);
    const cls = act.sales >= pace ? 'good' : act.sales >= pace * 0.85 ? 'warn' : 'bad';
    const rem = n - last;
    const avg = act.sales / last;
    const need = (t) => rem > 0 && act.sales < t ? `perlu <b>${rm((t - act.sales) / rem)}</b> sehari` : (act.sales >= t ? 'target dicapai' : 'bulan tamat');

    let h = `<section class="card"><div class="card-head"><div><div class="eyebrow">Company Sales · ${ymLabel(state.ym)}</div>` +
      `<h2 class="title">Prestasi bulan ini</h2></div><span class="badge"><i></i>Hari ${last}/${n}</span></div>` +
      `<div class="grid2"><div class="tile full"><div class="lbl">Total Sales</div><div class="big">${rm(act.sales)}</div>` +
      `<div class="small">Data hingga ${shortDate(state.ym, last)}</div></div>` +
      `<div class="tile center ${khas ? '' : 'full'}">${ring(p, cls)}<div class="lbl">vs Target</div><div class="small">${rm(tg.sales)}</div>` +
      `<div style="margin-top:8px">${sdWord(act.sales - tg.sales, rm)}</div></div>`;
    if (khas) {
      h += `<div class="tile center">${ring(pct(act.sales, khas))}<div class="lbl">vs Target Khas</div><div class="small">${rm(khas)}</div>` +
        `<div style="margin-top:8px">${sdWord(act.sales - khas, rm)}</div></div>`;
    }
    h += `<div class="tile full"><div class="lbl">Kadar harian</div><div class="small" style="font-size:13px;color:var(--text-2)">` +
      `Purata <b>${rm(avg)}</b> sehari. Untuk capai target: ${need(tg.sales)}` +
      (khas ? `; target khas: ${need(khas)}` : '') + `.</div></div></div>` +
      `<p class="note">Actual dibanding target bulanan penuh. Surplus/Deficit = Actual tolak Target.</p></section>`;

    h += catRings(act, tg, last, n);

    h += `<section class="card flat"><div class="eyebrow">Actual vs Target · bulanan</div>${table(act, tg, khas)}` +
      `<p class="note">Phone = Apple New + Apple Used + Android New + CCTI Sold. Angka ikut sheet, jadi jumlah sub-kategori mungkin beza sedikit daripada Phone.</p></section>`;

    const lines = [{ v: tg.sales, color: 'rgba(255,255,255,.7)' }];
    if (khas) lines.push({ v: khas, color: '#FFC46B' });
    h += `<section class="card flat"><div class="eyebrow">Cumulative sales</div>${lineChart(K.cumulative(c.rows, state.ym), n, lines)}` +
      `<div class="legend"><span><i style="background:#6FA3FF"></i>Actual</span><span><i style="background:rgba(255,255,255,.7)"></i>Target</span>` +
      (khas ? `<span><i style="background:#FFC46B"></i>Target Khas</span>` : '') + `</div></section>`;
    return h;
  }

  function viewWeekly() {
    const c = ctx();
    if (!c.last) return empty('Tiada data jualan', 'Belum ada rekod untuk ' + ymLabel(state.ym) + '.');
    const { rows, last, n, tg } = c;
    const sh = K.weekShares(C, state.ym);
    const equal = state.ym < C.weekShares.from;
    const khasM = C.targetKhas[state.ym];
    if (state.week == null || state.weekYm !== state.ym) { state.week = K.weekOfDay(last, C); state.weekYm = state.ym; }
    const w = state.week;
    const range = i => [C.weekRanges[i][0], i === 3 ? n : C.weekRanges[i][1]];

    let h = '<div class="chips">';
    for (let i = 0; i < 4; i++) {
      const r = range(i);
      h += `<button data-week="${i}" class="${i === w ? 'on' : ''}">W${i + 1}<small>${r[0]}–${r[1]}</small></button>`;
    }
    h += '</div>';

    const r = range(w), ws = K.sumRows(K.weekRows(rows, state.ym, w, C)), wt = K.scale(tg, sh[w]);
    const wk = khasM ? khasM * sh[w] : null;
    const status = last < r[0] ? 'Belum bermula' : last < r[1] ? 'Minggu berjalan' : 'Minggu habis';
    const p = pct(ws.sales, wt.sales);

    h += `<section class="card"><div class="card-head"><div><div class="eyebrow">Weekly · W${w + 1} · ${r[0]}–${r[1]} ${MONTHS[+state.ym.slice(5) - 1]}</div>` +
      `<h2 class="title">Sales minggu ini</h2></div><span class="badge"><i style="background:${last >= r[1] ? 'var(--good)' : 'var(--warn)'}"></i>${status}</span></div>` +
      `<div class="grid2"><div class="tile full"><div class="lbl">Total Sales W${w + 1}</div><div class="big">${rm(ws.sales)}</div>` +
      `<div class="small">Target minggu ${rm(wt.sales)}</div></div>` +
      `<div class="tile center ${wk ? '' : 'full'}">${ring(p)}<div class="lbl">vs Target</div><div class="small">${rm(wt.sales)}</div>` +
      `<div style="margin-top:8px">${sdWord(ws.sales - wt.sales, rm)}</div></div>`;
    if (wk) {
      h += `<div class="tile center">${ring(pct(ws.sales, wk))}<div class="lbl">vs Target Khas</div><div class="small">${rm(wk)}</div>` +
        `<div style="margin-top:8px">${sdWord(ws.sales - wk, rm)}</div></div>`;
    }
    h += `</div>` + (status === 'Minggu berjalan' ? `<p class="note strong">Minggu belum habis (data hingga ${shortDate(state.ym, last)}) tetap dibanding target mingguan penuh, bukan pro-rata.</p>` : '') + `</section>`;

    h += `<section class="card flat"><div class="eyebrow">Actual vs Target · W${w + 1}</div>${table(ws, wt, wk)}` +
      `<p class="note">Target mingguan = target bulanan ${equal ? 'dibahagi 4 (sama rata)' : 'x pecahan W1 25%, W2 24%, W3 21%, W4 30%'}.</p></section>`;

    const items = [];
    let tbl = '<div class="table-scroll"><table class="vs"><thead><tr><th>Minggu</th><th>Actual</th><th>Target</th><th>Surplus / Deficit</th></tr></thead><tbody>';
    for (let i = 0; i < 4; i++) {
      const rr = range(i), a = K.sumRows(K.weekRows(rows, state.ym, i, C)).sales, t = tg.sales * sh[i], started = last >= rr[0];
      items.push({ label: 'W' + (i + 1), a: started ? a : null, t });
      const diff = a - t;
      tbl += `<tr class="l0"><td>W${i + 1}<small class="pc">${rr[0]}–${rr[1]}</small></td><td>${started ? rm(a) : '–'}</td><td>${rm(t)}</td>` +
        `<td class="sd ${started ? (diff >= 0 ? 'good' : 'bad') : ''}">${started ? (diff >= 0 ? '+' : '−') + rm(Math.abs(diff)) : '–'}</td></tr>`;
    }
    tbl += '</tbody></table></div>';
    h += `<section class="card flat"><div class="eyebrow">Total Sales · perbandingan minggu</div>${barChart(items)}` +
      `<div class="legend"><span><i style="background:#6FA3FF"></i>Actual</span><span><i style="background:#34D399"></i>Capai target</span><span><i style="background:rgba(255,255,255,.28)"></i>Target</span></div>${tbl}</section>`;
    return h;
  }

  /* ---------- render & state ---------- */
  function render() {
    document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === state.tab));
    const v = $('#view');
    if (!C.apiUrl || C.apiUrl.indexOf('PASTE_') === 0) {
      v.innerHTML = empty('Sambungan data belum disetkan', 'Letak URL Apps Script dalam js/config.js (lihat README).');
      return;
    }
    if (!state.data.length) { v.innerHTML = empty('Memuatkan data…', 'Sila tunggu sebentar.'); return; }
    v.innerHTML = state.tab === 'weekly' ? viewWeekly() : viewOverview();
    v.querySelectorAll('[data-week]').forEach(b => b.addEventListener('click', () => { state.week = +b.dataset.week; render(); }));
  }

  function setMonths() {
    const set = {};
    state.data.forEach(r => { if (+r.sales > 0) set[r.d.slice(0, 7)] = 1; });
    const list = Object.keys(set).sort().reverse();
    const sel = $('#month');
    sel.innerHTML = list.map(ym => `<option value="${ym}">${MONTHS[+ym.slice(5) - 1]} ${ym.slice(0, 4)}</option>`).join('');
    if (!state.ym || !set[state.ym]) state.ym = list[0] || null;
    sel.value = state.ym;
  }

  function setUpdated(iso, note) {
    let t = 'Belum dimuat';
    if (iso) { const d = new Date(iso); t = 'Dikemas kini ' + d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }); }
    $('#updated').textContent = note ? t + ' · ' + note : t;
  }

  /* ---------- data ---------- */
  async function fetchData(pin) {
    const res = await fetch(C.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ pin }) });
    const j = await res.json();
    if (!j.ok) { const e = new Error(j.error || 'Ralat'); e.auth = /PIN/i.test(j.error || ''); throw e; }
    return j;
  }

  function apply(j) {
    state.data = j.rows; state.updated = j.updated;
    setMonths(); setUpdated(j.updated); render();
  }

  async function refresh(manual) {
    const pin = localStorage.getItem(LS_PIN);
    if (!pin) return showGate();
    const btn = $('#btn-refresh'); btn.classList.add('spin');
    try {
      const j = await fetchData(pin);
      try { localStorage.setItem(LS_DATA, JSON.stringify({ updated: j.updated, rows: j.rows })); } catch (e) { /* penuh */ }
      apply(j);
    } catch (e) {
      if (e.auth) { localStorage.removeItem(LS_PIN); showGate(e.message); }
      else { setUpdated(state.updated, 'gagal muat semula'); if (manual) alert('Gagal muat semula: ' + e.message); }
    } finally { btn.classList.remove('spin'); }
  }

  /* ---------- gate / info ---------- */
  function showGate(msg) { $('#gate').hidden = false; $('#gate-msg').textContent = msg || ''; $('#pin').value = ''; setTimeout(() => $('#pin').focus(), 50); }

  $('#gate-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const pin = $('#pin').value.trim(), msg = $('#gate-msg');
    msg.style.color = 'var(--text-2)'; msg.textContent = 'Menyemak…';
    try {
      const j = await fetchData(pin);
      localStorage.setItem(LS_PIN, pin);
      try { localStorage.setItem(LS_DATA, JSON.stringify({ updated: j.updated, rows: j.rows })); } catch (e) { /* penuh */ }
      $('#gate').hidden = true; msg.textContent = ''; apply(j);
    } catch (e) { msg.style.color = 'var(--bad)'; msg.textContent = e.message; }
  });

  $('#btn-info').addEventListener('click', () => {
    $('#info-body').innerHTML = 'Data jualan company dari Google Sheet (tab masterBACK) melalui Apps Script, dilindungi PIN. ' +
      'Target dan pecahan mingguan boleh diubah dalam <b>js/config.js</b>.<br><br>' + $('#updated').textContent + '.';
    $('#info').hidden = false;
  });
  $('#btn-close').addEventListener('click', () => { $('#info').hidden = true; });
  $('#btn-logout').addEventListener('click', () => {
    localStorage.removeItem(LS_PIN); localStorage.removeItem(LS_DATA);
    state.data = []; $('#info').hidden = true; render(); showGate();
  });
  $('#btn-refresh').addEventListener('click', () => refresh(true));
  $('#month').addEventListener('change', e => { state.ym = e.target.value; state.week = null; render(); });
  $('#tabbar').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    state.tab = b.dataset.tab; render(); window.scrollTo({ top: 0 });
  });

  /* ---------- start ---------- */
  $('#logo').src = C.logo; $('#gate-logo').src = C.logo;
  try {
    const cached = JSON.parse(localStorage.getItem(LS_DATA) || 'null');
    if (cached && cached.rows && localStorage.getItem(LS_PIN)) apply(cached);
  } catch (e) { /* abaikan */ }
  render();
  if (localStorage.getItem(LS_PIN)) refresh(false); else showGate();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && localStorage.getItem(LS_PIN)) refresh(false); });

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
