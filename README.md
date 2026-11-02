# 🏢 JRS GeoFace Absensi - Presensi Biometrik & Sistem Kerja Fleksibel

Aplikasi manajemen presensi modern berbasis **Geofence GPS**, **Verifikasi Biometrik Wajah Real-Time**, **Rotasi 4 Hari WFO & 1 Hari WFH Bergilir**, serta **Ruang Diskusi & Chat Komunikasi Tim**.

---

## ✨ Fitur Utama

- 📍 **Presensi Geofence GPS Kantor Pusat**: Validasi radius kehadiran akurat di Kantor Pusat dengan simulasi GPS dan toleransi radius yang dapat diatur HR.
- 📸 **Verifikasi Wajah Biometrik**: Tangkapan wajah live via webcam/kamera smartphone dengan deteksi validitas biometrik dan anti-spoofing.
- 🏠 **Skema Rotasi 4 WFO / 1 WFH Mingguan**: Setiap karyawan mendapatkan giliran 1 hari WFH tetap per minggu. Radius geofence otomatis dilewati saat giliran WFH aktif.
- 💬 **Diskusi & Chat Tim**:
  - Saluran pengumuman resmi & koordinasi per departemen.
  - Chat langsung (DM) antar karyawan dengan indikator status online & balasan instan.
  - Forum diskusi interaktif dengan kategori (Pekerjaan, WFH, Ide, Santai), upvote/like, dan komentar bersarang.
- 🛡️ **Portal Superadmin HR**:
  - Audit log presensi & inspeksi foto biometrik.
  - Manajemen roster WFH dan persetujuan cuti karyawan.
  - Manajemen akun pengguna (Karyawan & Administrator).
  - Ekspor laporan kehadiran payroll lengkap ke **Excel (.xlsx)**, **CSV**, dan **PDF**.

---

## 👥 Akun Demo & Kredensial

| Role | Nama | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin HR** | Sarah Wijaya, M.Psi | `admin@company.com` | `admin123` | Akses penuh dashboard HR & payroll |
| **Karyawan (Direktur)** | Natasha Kirovska | `natasha.k@company.com` | `password123` | Giliran WFH: Rabu |
| **Karyawan (Sales)** | Iida Niskanen | `iida.n@company.com` | `password123` | Giliran WFH: Senin |
| **Karyawan (Sales)** | June Cha | `june.cha@company.com` | `password123` | Giliran WFH: Jumat |
| **Karyawan (Sales)** | Jonathan Nuez | `jonathan.n@company.com` | `password123` | Giliran WFH: Kamis |

---

## 🚀 Panduan Menjalankan Lokal

**Prasyarat:** Node.js versi 18+ atau 20+

1. Pasang dependensi:
   ```bash
   npm install
   ```

2. Jalankan mode pengembangan:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

3. Jalankan pengujian lint & type check:
   ```bash
   npm run lint
   ```

---

## 🌐 Panduan Deploy ke Produksi

### Opsi 1: Deploy ke Vercel (Rekomendasi)
Aplikasi sudah dilengkapi dengan konfigurasi [`vercel.json`](vercel.json):
1. Hubungkan repositori Git ke [Vercel](https://vercel.com).
2. Framework otomatis terdeteksi sebagai **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Klik **Deploy**.

### Opsi 2: Deploy ke Netlify
Aplikasi sudah dilengkapi dengan [`netlify.toml`](netlify.toml) dan [`public/_redirects`](public/_redirects):
1. Hubungkan repositori ke [Netlify](https://netlify.com).
2. Publish directory: `dist`
3. Klik **Deploy site**.

### Opsi 3: Node.js Production Server (VPS / Cloud Run / Railway / Render)
Aplikasi menyertakan [`server.js`](server.js) siap pakai dengan caching header & health check `/healthz`:
```bash
# 1. Build aset frontend
npm run build

# 2. Jalankan server produksi
npm start
```
Server akan aktif di port yang ditentukan (`PORT` environment variable, default: `3000`).

### Opsi 4: Docker Container
Aplikasi menyertakan multi-stage [`Dockerfile`](Dockerfile) yang efisien dan aman:
```bash
# Build image Docker
docker build -t jrs-absensi:latest .

# Jalankan container di port 3000
docker run -d -p 3000:3000 --name jrs-app jrs-absensi:latest
```
Akses di `http://localhost:3000` atau cek endpoint health di `http://localhost:3000/healthz`.

---

## 📄 Lisensi
Apache-2.0 · PT JRS Indonesia
