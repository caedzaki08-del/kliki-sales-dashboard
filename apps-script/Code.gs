/**
 * KLIKI Sales Dashboard — API data (Apps Script, container-bound pada MASTER SHEET SALES OUTLET)
 *
 * Fungsi: baca tab masterBACK, pulangkan kolum jualan peringkat company sahaja sebagai JSON,
 * hanya jika PIN betul. Sheet kekal private; ID sheet tak perlu masuk repo.
 *
 * Setup PIN: Project Settings > Script properties > tambah  PIN = (nombor pilihan anda)
 */

var TAB_NAME = 'masterBACK';
var TZ = 'Asia/Kuala_Lumpur';
var FIRST_DATE = '2025-01-01';
var MAX_FAILS = 10;          // gagal PIN dalam 10 minit sebelum disekat sementara

// key -> nama header tepat dalam masterBACK
var COLS = {
  sales:    'OVERALL SALES DAILY (RM)',
  phone:    'OVERALL PHONE SALES (RM)',
  repair:   'OVERALL REPAIR DAILY (RM)',
  ipUsed:   'OVERALL IP USED SALES (RM)',
  ipNew:    'OVERALL IP NEW SALES (RM)',
  android:  'OVERALL NEWSET SALES (RM)',
  ccti:     'OVERALL CCTI SOLD SALES (RM)',
  acc:      'AKSESORI (RM)',
  cctiRecv: 'CCTI RECEIVED (UNIT)'
};

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var cache = CacheService.getScriptCache();
    var fails = Number(cache.get('fails') || 0);
    if (fails >= MAX_FAILS) return out_({ ok: false, error: 'Terlalu banyak cubaan. Cuba lagi dalam 10 minit.' });

    var pin = PropertiesService.getScriptProperties().getProperty('PIN');
    if (!pin) return out_({ ok: false, error: 'PIN belum ditetapkan dalam Script properties.' });
    if (String(body.pin || '') !== String(pin)) {
      cache.put('fails', String(fails + 1), 600);
      return out_({ ok: false, error: 'PIN salah' });
    }
    cache.remove('fails');
    return out_({ ok: true, updated: Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"), rows: readRows_() });
  } catch (err) {
    return out_({ ok: false, error: 'Ralat server: ' + err.message });
  }
}

// Buka URL dalam browser terus: tak pulang data, hanya status.
function doGet() { return out_({ ok: true, service: 'KLIKI Sales API' }); }

function readRows_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_NAME);
  if (!sh) throw new Error('Tab ' + TAB_NAME + ' tidak jumpa');
  var vals = sh.getDataRange().getValues();
  var head = vals[0].map(function (h) { return String(h).replace(/\s+/g, ' ').trim(); });
  var idx = { d: head.indexOf('DATE') };
  Object.keys(COLS).forEach(function (k) { idx[k] = head.indexOf(COLS[k]); });
  Object.keys(idx).forEach(function (k) { if (idx[k] < 0) throw new Error('Header tak jumpa: ' + (k === 'd' ? 'DATE' : COLS[k])); });

  var rows = [];
  for (var i = 1; i < vals.length; i++) {
    var d = dateStr_(vals[i][idx.d]);
    if (!d || d < FIRST_DATE) continue;
    var r = { d: d };
    Object.keys(COLS).forEach(function (k) { r[k] = num_(vals[i][idx[k]]); });
    rows.push(r);
  }
  return rows;
}

function dateStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  var s = String(v || '').trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);       // dd/MM/yyyy
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[0] : '';
}

function num_(v) {
  if (typeof v === 'number') return v;
  var n = parseFloat(String(v || '').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
