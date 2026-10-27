// KLIKI Sales Dashboard — konfigurasi
// Tukar URL Apps Script dan target di sini sahaja.
// JANGAN letak ID MASTER SHEET atau PIN di sini: repo dan site ini public.
(function (root) {
  const CONFIG = {
    // URL Web App Apps Script (lihat README.md, langkah 2). Berakhir dengan /exec
    apiUrl: 'PASTE_APPS_SCRIPT_WEB_APP_URL_HERE',

    logo: 'https://klikidotmy.github.io/kliki-marketing-dashboard/icons/logo-white.png',

    // Target bulanan company (RM, kecuali cctiReceived = unit)
    monthly: {
      total: 640000,        // Phone + Repair + Accessories
      phone: 565000,        // Apple New + Apple Used + Android New + CCTI Sold
      repair: 66000,        // 3 outlet Kliki x RM22,000
      accessories: 9000,    // 3 outlet Kliki x RM3,000
      cctiReceived: 40      // Kliki 30 + Kliki Mini 10 (unit)
    },

    // Pecahan target Phone ikut komposisi company (Apple Used 50, Android New 16, CCTI 15, Apple New 5)
    phoneWeights: { ipUsed: 50, android: 16, ccti: 15, ipNew: 5 },

    // Target mingguan: sebelum "from" = sama rata (bulanan / 4); mulai "from" guna pecahan W1-W4
    weekShares: { from: '2026-11', split: [0.25, 0.24, 0.21, 0.30] },
    // Minggu: W1 1-7, W2 8-14, W3 15-21, W4 22 hingga habis bulan
    weekRanges: [[1, 7], [8, 14], [15, 21], [22, 31]],

    // TARGET KHAS overall sales (RM) untuk baki 2026
    targetKhas: { '2026-10': 702554, '2026-11': 606501, '2026-12': 755261 }
  };
  root.KLIKI_CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
