# KLIKI Sales Dashboard

PWA dashboard jualan KLIKI (Overview HQ + Mingguan W1–W4). Data terus dari Google Sheet
**MASTER SHEET SALES OUTLET** (tab `masterBACK`) melalui Google Apps Script yang dilindungi PIN.
Sheet kekal private. Tiada ID sheet atau data jualan dalam repo ini.

## Setup (sekali sahaja)

### 1. Pasang Apps Script pada MASTER SHEET
1. Buka MASTER SHEET SALES OUTLET > **Extensions > Apps Script**.
2. Padam kod sedia ada, tampal isi `apps-script/Code.gs`, simpan.
3. **Project Settings > Script properties > Add script property**: nama `PIN`, nilai = nombor PIN pilihan anda.

### 2. Deploy sebagai Web App
1. **Deploy > New deployment > Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Salin URL yang berakhir dengan `/exec`.

> "Anyone" hanya membenarkan sesiapa panggil API; data hanya keluar jika PIN betul
> (10 kali salah dalam 10 minit akan disekat sementara). Guna PIN yang kuat dan jangan kongsi di tempat awam.

### 3. Letak URL dalam dashboard
Edit `js/config.js`, tukar `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` dengan URL `/exec`, commit dan push.

### 4. Hidupkan GitHub Pages
Repo > **Settings > Pages > Deploy from a branch > main / (root)**.
Dashboard live di `https://caedzaki08-del.github.io/kliki-sales-dashboard/`.

Pada telefon: buka link > menu browser > **Add to Home Screen** (jadi PWA).

## Ubah target
Semua target dalam `js/config.js`: target bulanan, pecahan Phone, pecahan mingguan, dan TARGET KHAS.
Bulan baru muncul sendiri dalam dropdown bila ada jualan dalam sheet.

## Peraturan kiraan
- Minggu: W1 1–7, W2 8–14, W3 15–21, W4 22 hingga habis bulan.
- Target mingguan: sebelum Nov 2026 = bulanan ÷ 4; mulai Nov 2026 = W1 25%, W2 24%, W3 21%, W4 30%.
- Minggu yang belum habis dibanding target mingguan penuh (bukan pro-rata).
- Surplus/Deficit = Actual tolak Target (RM, atau unit untuk CCTI Received).
- Pecahan target Phone mengikut komposisi Apple Used 50 : Android New 16 : CCTI 15 : Apple New 5.

## Kemas kini selepas deploy
Jika ubah `Code.gs`, buat **Deploy > Manage deployments > Edit > New version** (URL kekal sama).
