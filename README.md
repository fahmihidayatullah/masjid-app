
# Masjid App

Aplikasi TV Display modern untuk Masjid, menampilkan jadwal sholat, countdown iqomah, running text, live streaming YouTube, event poster, info WhatsApp Group, dan gambar inspiratif dari Unsplash.

## Fitur Utama

- **Jadwal Sholat Otomatis**: Ambil dari API MyQuran, tampil grid dan highlight waktu berikutnya.
- **Countdown Iqomah**: Hitung mundur otomatis setelah adzan.
- **Live Streaming YouTube**: Bisa diatur dari localStorage.
- **Event Poster**: Tampilkan poster kegiatan/event masjid.
- **Random Ayat/Hadist**: Bergantian dengan background Unsplash.
- **Running Text**: Informasi berjalan di bawah.
- **Countdown Ramadhan**: Hari menuju 1 Ramadhan (Hijriyah).
- **Khatib/Kajian**: Tampilkan info khatib Jumat atau jadwal kajian berikutnya.
- **Tampilan Fullscreen**: Optimasi untuk Smart TV (rasio 16:9).
- **Mode Setting**: Ubah nama masjid, running text, dsb.

## Struktur Folder (Utama)

```
masjid-app/
├── public/
│   ├── assets/
│   │   ├── logo.png
│   │   ├── tarhib1447.png
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Main.jsx
│   │   ├── TvDisplay.jsx
│   │   ├── Iqomah.jsx
│   │   ├── RekapJamaah.jsx
│   │   ├── Deteksi.jsx
│   │   ├── setting.jsx
│   │   └── ...
│   ├── styles/
│   │   ├── Main.css
│   │   ├── app.css
│   │   └── ...
│   └── assets/
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.mediamtx
├── mediamtx-custom.yml
├── nginx.conf
├── package.json
├── vite.config.js
└── ...
```



## Cara Menjalankan (Docker Compose)

1. **Clone repository**
   ```bash
   git clone https://github.com/username/masjid-app.git
   cd masjid-app
   ```

2. **Edit konfigurasi environment**
   - Salin `.env.example` menjadi `.env` lalu sesuaikan jika perlu:
     ```bash
     cp .env.example .env
     ```
   - Contoh isi penting:
     ```env
     REACT_APP_RTSP_STREAM_URL=/stream
     REACT_APP_YOUTUBE_URL=https://www.youtube.com/embed/your_stream_id
     REACT_APP_STREAM_URL=https://www.youtube.com/embed/your_stream_id
     REACT_APP_MOSQUE_NAME=Nama Masjid Anda
     REACT_APP_RUNNING_TEXT=Tulisan berjalan di sini
     REACT_APP_UNSPLASH_ACCESS_KEY=YOUR_UNSPLASH_ACCESS_KEY
     ```

3. **Jalankan semua layanan dengan Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

4. **Akses aplikasi**
   - Web app: buka browser ke `http://localhost:8091` (atau `http://IP-PUBLIC:8091` di server/TV)
   - Streaming HLS: `/stream/cam1/index.m3u8`, `/stream/cam2/index.m3u8`, dst (via nginx proxy)

5. **Akses RTSP (opsional, untuk testing):**
   - RTSP: `rtsp://localhost:8554/cam1` (hanya jika port 8554 di-expose)

5. **Akses RTSP (opsional, untuk testing):**
   - RTSP: `rtsp://localhost:8554/cam1` (hanya jika port 8554 di-expose)



## Konfigurasi Penting & Custom

Edit file `.env` (atau `.env.example`) untuk mengatur:

```env
REACT_APP_RTSP_STREAM_URL=/stream
REACT_APP_YOUTUBE_URL=https://www.youtube.com/embed/your_stream_id
REACT_APP_STREAM_URL=https://www.youtube.com/embed/your_stream_id
REACT_APP_MOSQUE_NAME=Nama Masjid Anda
REACT_APP_RUNNING_TEXT=Tulisan berjalan di sini
REACT_APP_UNSPLASH_ACCESS_KEY=YOUR_UNSPLASH_ACCESS_KEY
```

> **Catatan:**
> - Jika mengubah file `.env`, rebuild image jika pakai Docker: `docker-compose build`
> - Untuk development lokal (tanpa Docker):
>   1. Jalankan `npm install`
>   2. Jalankan `npm run dev`
>   3. Akses di `http://localhost:3000`

### Custom Konten (Tanpa Build Ulang)
- **YouTube URL**: Bisa diubah via localStorage key `youtubeUrl` di browser.
- **Poster Event**: Ganti file `/public/assets/tarhib1447.png`.



## Kebutuhan

- Docker & Docker Compose
- Node.js & npm (jika ingin development lokal)
- Koneksi internet (untuk API jadwal sholat, Unsplash, dan YouTube)
- Smart TV/Browser modern (untuk tampilan fullscreen optimal)

## Struktur Docker Compose

```yaml
services:
   mediamtx:
      build:
         context: .
         dockerfile: Dockerfile.mediamtx
      container_name: mediamtx
      ports:
         - "8554:8554"  # RTSP port (opsional)
      volumes:
         - ./mediamtx-custom.yml:/mediamtx.yml:ro
      restart: unless-stopped
      networks:
         - masjid-network

   masjid-app:
      image: fahmihidayatullah/masjid-app:mediamtx
      container_name: masjid-app
      restart: unless-stopped
      networks:
         - masjid-network
      depends_on:
         - mediamtx

   nginx:
      image: nginx:alpine
      container_name: nginx-proxy
      ports:
         - "8091:80"
      volumes:
         - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      restart: unless-stopped
      networks:
         - masjid-network
      depends_on:
         - masjid-app
         - mediamtx

networks:
   masjid-network:
      driver: bridge
```

## Proxy Streaming (nginx)

```nginx
server {
      listen 80;
      server_name _;

      location /stream/ {
            proxy_pass http://mediamtx:8888/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_cache off;
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header Access-Control-Expose-Headers 'Content-Length,Content-Range';
      }

      location / {
            proxy_pass http://masjid-app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
      }
}
```

## Konfigurasi MediaMTX (mediamtx-custom.yml)

```yaml
logLevel: info
rtsp: yes
hls: yes
hlsAddress: :8888
hlsAlwaysRemux: yes
paths:
   cam1:
      source: rtsp://username:password@IP_ADDRESS:PORT/Streaming/Channels/102
      rtspTransport: tcp
      sourceOnDemand: no
   cam2:
      runOnInit: ffmpeg -loglevel warning -rtsp_transport tcp -i rtsp://username:password@IP_ADDRESS:PORT/Streaming/Channels/202 -c:v copy -an -f rtsp rtsp://localhost:$RTSP_PORT/$MTX_PATH
      runOnInitRestart: yes
   cam3:
      runOnInit: ffmpeg -loglevel warning -rtsp_transport tcp -i rtsp://username:password@IP_ADDRESS:PORT/Streaming/Channels/302 -c:v copy -an -f rtsp rtsp://localhost:$RTSP_PORT/$MTX_PATH
      runOnInitRestart: yes
   cam4:
      source: rtsp://username:password@IP_ADDRESS:PORT/Streaming/Channels/401
      rtspTransport: tcp
      sourceOnDemand: no
```


## Jalankan Manual (Tanpa Docker)

Untuk development lokal:

```bash
npm install
npm run dev
# lalu buka http://localhost:3000
```

Untuk menjalankan MediaMTX dan app secara manual (misal untuk development Mac/Linux):

```bash
./start-cctv.sh
```


## Lisensi

MIT

---

Kontribusi dan saran sangat terbuka!

---
