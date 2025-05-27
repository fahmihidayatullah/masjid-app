# Masjid App

Aplikasi TV Display untuk Masjid, menampilkan jadwal sholat, countdown iqomah, running text, live streaming YouTube, dan gambar inspiratif dari Unsplash.

## Fitur Utama

- **Tampilan Jadwal Sholat**: Menampilkan waktu sholat harian secara otomatis.
- **Countdown Iqomah**: Hitung mundur waktu iqomah setelah adzan.
- **Live Streaming YouTube**: Tampilkan live stream (misal: Masjidil Haram) di layar utama.
- **Gambar Unsplash**: Bergantian dengan live stream, tampilkan gambar masjid dari Unsplash.
- **Running Text**: Informasi berjalan di bagian bawah layar.
- **Mode Setting**: Ubah nama masjid dan running text sesuai kebutuhan.
- **Tampilan Fullscreen**: Mode layar penuh untuk YouTube atau gambar Unsplash.
- **Responsive**: Tampilan optimal untuk TV/monitor besar.

## Struktur Folder

```
src/
  components/
    App.js
    TvDisplay.js
    Main.js
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
   - Edit file `src/components/config.js` untuk mengisi `youtubeUrl` dan `accessKey` Unsplash.

4. **Jalankan aplikasi**
   ```bash
   npm start
   ```

5. **Akses aplikasi**
   - Buka browser ke `http://localhost:3000`

## Konfigurasi

Edit file `src/components/config.js`:

```js
const config = {
  youtubeUrl: "https://www.youtube.com/embed/your_stream_id",
  accessKey: "YOUR_UNSPLASH_ACCESS_KEY"
};
export default config;
```

## Kebutuhan

- Node.js & npm
- Koneksi internet (untuk API jadwal sholat, Unsplash, dan YouTube)

## Lisensi

MIT

---

Kontribusi dan saran sangat terbuka!