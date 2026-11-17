/* Simulasi minimum perkhidmatan Google Apps Script untuk ujian tempatan.
 * Dimuatkan dalam pelayar (Playwright) sebelum Code.gs. Bukan untuk produksi. */
function MockSheet(name) { this.name = name; this.d = []; this.id = Math.floor(Math.random() * 1e6); }
MockSheet.prototype = {
  getLastRow() { return this.d.length; },
  getLastColumn() { return Math.max(0, ...this.d.map(r => r.length)); },
  getName() { return this.name; }, getSheetId() { return this.id; },
  getRange(r, c, nr, nc) {
    if (typeof r === 'string') { const m = r.match(/([A-Z])(\d+)/); c = m[1].charCodeAt(0) - 64; r = +m[2]; }
    nr = nr || 1; nc = nc || 1; const sh = this;
    const rg = {
      getValues() { const o = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) { const v = (sh.d[r - 1 + i] || [])[c - 1 + j]; row.push(v === undefined ? '' : v); } o.push(row); } return o; },
      getDisplayValues() { return rg.getValues().map(rw => rw.map(v => v instanceof Date ? v.toISOString().slice(0, 10) : (typeof v === 'number' && Math.abs(v) >= 1e11 ? v.toExponential(5).replace(/\.?0+e/, 'E').replace('e', 'E') : String(v)))); },
      getValue() { return rg.getValues()[0][0]; },
      setValues(v) { for (let i = 0; i < v.length; i++) { sh.d[r - 1 + i] = sh.d[r - 1 + i] || []; for (let j = 0; j < v[i].length; j++) { let x = v[i][j]; if (typeof x === 'string' && x[0] === "'") x = x.slice(1); sh.d[r - 1 + i][c - 1 + j] = x; } } return rg; },
      setValue(x) { return rg.setValues([[x]]); },
      clearContent() { for (let i = 0; i < nr; i++) { const row = sh.d[r - 1 + i]; if (row) for (let j = 0; j < nc; j++) row[c - 1 + j] = ''; } return rg; },
      setNumberFormat() { return rg; }, setFontWeight() { return rg; }, setBackground() { return rg; }, setFontSize() { return rg; }, setFontColor() { return rg; }
    };
    return rg;
  },
  getDataRange() { return this.getRange(1, 1, this.d.length, this.getLastColumn()); },
  appendRow(r) { this.d.push(r.slice()); }, deleteRows(s, n) { this.d.splice(s - 1, n); },
  setFrozenRows() {}, setColumnWidth() {}, setHiddenGridlines() {}, clear() { this.d = []; }, activate() {}
};
var _ss = {
  sheets: {}, name: 'Ujian',
  getSheetByName(n) { return this.sheets[n] || null; },
  insertSheet(n) { return (this.sheets[n] = new MockSheet(n)); },
  getUrl() { return 'https://docs.google.com/spreadsheets/d/UJIAN/edit'; },
  rename(n) { this.name = n; }, toast() {}
};
var SpreadsheetApp = {
  getActive() { return _ss; }, flush() {},
  getUi() { return { alert() {}, showModalDialog() {}, ButtonSet: {}, Button: {}, createMenu() { return { addItem() { return this; }, addSeparator() { return this; }, addToUi() {} }; } }; }
};
var Session = { getActiveUser() { return { getEmail() { return window.MOCK_EMAIL || ''; } }; }, getScriptTimeZone() { return 'Asia/Kuala_Lumpur'; } };
var LockService = { getScriptLock() { return { waitLock() {}, tryLock() { return true; }, releaseLock() {} }; } };
var ScriptApp = { getScriptId() { return 'SCRIPTID'; }, getOAuthToken() { return 'TOKEN'; }, getService() { return { getUrl() { return window.MOCK_URL || null; } }; } };
var UrlFetchApp = { fetch() { return { getResponseCode: () => 200, getContentText: () => JSON.stringify(window.MOCK_RELEASE || { version: '0.0.0', ref: 'x' }) }; } };
var HtmlService = {};
var Utilities = {
  getUuid() { return Math.random().toString(16).slice(2) + 'abcdef0123456789'; },
  formatDate(d, tz, f) { const p = n => ('0' + n).slice(-2); return f.replace('yyyy', d.getFullYear()).replace('MM', p(d.getMonth() + 1)).replace('dd', p(d.getDate())).replace('HH', p(d.getHours())).replace('mm', p(d.getMinutes())); },
  computeDigest(a, s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return [h & 255, (h >> 8) & 255, (h >> 16) & 255, (h >> 24) & 255, s.length & 255]; },
  DigestAlgorithm: { MD5: 'md5' }
};
/* google.script.run → panggil fungsi Code.gs terus (JSON round-trip seperti pelayan sebenar) */
window.google = { script: { host: { close() { window.CLOSED = 1; } }, get run() {
  let ok, fail; const o = new Proxy({}, { get(_, k) {
    if (k === 'withSuccessHandler') return h => { ok = h; return o; };
    if (k === 'withFailureHandler') return h => { fail = h; return o; };
    return function () { const a = JSON.parse(JSON.stringify(Array.from(arguments)));
      setTimeout(() => { try { ok(JSON.parse(JSON.stringify(window[k].apply(null, a)) ?? 'null')); } catch (e) { fail(e); } }, 30); };
  } }); return o; } } };
