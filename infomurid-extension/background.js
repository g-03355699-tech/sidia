/* Klik ikon SiDIA pada toolbar: buka panel import dalam tab Infomurid.
 * Jika tab dibuka sebelum extension dipasang, skrip dimasukkan sekarang. */
var INFOMURID = /^https?:\/\/(www\.)?infomurid\.com\//i;

chrome.action.onClicked.addListener(function (tab) {
  if (!tab || !tab.url || !INFOMURID.test(tab.url)) {
    chrome.tabs.create({ url: 'https://www.infomurid.com/Discipline/Index' });
    return;
  }
  if (!/\/Discipline\//i.test(new URL(tab.url).pathname)) {
    chrome.tabs.update(tab.id, { url: new URL(tab.url).origin + '/Discipline/Index' });
    return;
  }
  chrome.tabs.sendMessage(tab.id, { type: 'sidia-open' }, function () {
    if (!chrome.runtime.lastError) return;
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['sidia-core.js', 'content.js'] }, function () {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: function () { if (window.__sidiaOpen) window.__sidiaOpen(); } });
    });
  });
});
