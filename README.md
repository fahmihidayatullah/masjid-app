# Masjid App

Aplikasi TV Display untuk Masjid dengan sistem CCTV streaming, menampilkan jadwal sholat, countdown iqomah, running text, live streaming YouTube, gambar inspiratif, dan monitoring CCTV real-time menggunakan MediaMTX.

## Fitur Utama

- **Tampilan Jadwal Sholat**: Menampilkan waktu sholat harian secara otomatis.
- **Countdown Iqomah**: Hitung mundur waktu iqomah setelah adzan.
- **Live Streaming YouTube**: Tampilkan live stream (misal: Masjidil Haram) di Random Ayat
- **Running Text**: Informasi berjalan di bagian bawah layar.
- **Mode Setting**: Ubah nama masjid dan running text sesuai kebutuhan.
- **Tampilan Fullscreen**: Mode layar penuh untuk YouTube, gambar Unsplash, atau 

## Struktur Folder

```
src/
  components/
    App.js
    TvDisplay.js
    Iqomah.js
    Setting.js
  styles/
    app.css
    Main.css
  assets/
    logo.png
```

## Cara Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/username/masjid-app.git
   cd masjid-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi**
   - Edit file `.env` di root project Anda untuk mengatur konfigurasi yang dibutuhkan.

4. **Jalankan aplikasi**
   ```bash
   npm start
   ```

5. **Akses aplikasi**
   - Buka browser ke `http://localhost:3000`

## Konfigurasi

Edit file `.env` di root project Anda untuk mengatur konfigurasi berikut:

```env
REACT_APP_YOUTUBE_URL=https://www.youtube.com/embed/your_stream_id
REACT_APP_RUNNING_TEXT=Tulisan berjalan di sini
REACT_APP_UNSPLASH_ACCESS_KEY=YOUR_UNSPLASH_ACCESS_KEY
REACT_APP_MOSQUE_NAME=Nama Masjid Anda
```

> **Catatan:**  
> Setelah mengubah file `.env`, lakukan langkah berikut:
> 1. **Jika mode development:**  
>    Restart aplikasi dengan perintah `npm start`.
> 2. **Jika ingin build untuk production:**  
>    Jalankan perintah `npm run build` untuk menghasilkan folder `build` yang siap dideploy.

## Kebutuhan

- Node.js & npm
- Koneksi internet (untuk API jadwal sholat, Unsplash, dan YouTube)

## Lisensi

MIT

---

Kontribusi dan saran sangat terbuka!