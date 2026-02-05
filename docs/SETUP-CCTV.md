# Setup CCTV Streaming untuk Masjid App

## Masalah yang Diselesaikan

Aplikasi masjid-app memerlukan beberapa dependencies yang tidak terinstall di sistem local:

### ✅ Yang Sudah Terinstall:
- ✅ **Node.js & npm** - untuk aplikasi React
- ✅ **FFmpeg** - untuk video processing 
- ✅ **React dependencies** - sudah ada di package.json

### ❌ Yang Kurang (sudah diinstall):
- ✅ **MediaMTX** - converter RTSP ke HLS (sekarang sudah terinstall)

## Setup yang Telah Dilakukan

### 1. Install MediaMTX
```bash
# Download dan install MediaMTX
curl -L https://github.com/bluenviron/mediamtx/releases/download/v1.11.2/mediamtx_v1.11.2_darwin_arm64.tar.gz -o mediamtx.tar.gz
tar -xzf mediamtx.tar.gz
chmod +x mediamtx
```

### 2. Konfigurasi MediaMTX
File `mediamtx-custom.yml` telah dibuat dengan konfigurasi untuk tiap2 camera
```yaml
  # cam1 dan cam4 rtsp
  # cam2 dan cam3 menggunakan FFmpeg relay
```

### 3. Script Otomatis
File `start-cctv.sh` telah dibuat untuk mempermudah setup.

## Cara Menjalankan

### Metode 1: Menggunakan Script Otomatis
```bash
./start-cctv.sh
```

### Metode 2: Manual
```bash
# 1. Jalankan MediaMTX with spesifik mediamtx.yml
./mediamtx ./mediamtx.yml

# 2. Di terminal lain, jalankan React app
npm run dev
```

## Akses Stream

### HLS Endpoints:
- **Cam1**: http://localhost:8888/cam1/index.m3u8
- **Cam2**: http://localhost:8888/cam2/index.m3u8  
- **Cam3**: http://localhost:8888/cam3/index.m3u8
- **Cam4**: http://localhost:8888/cam4/index.m3u8

### Web Application:
- **Main App**: http://localhost:3000

## Troubleshooting

### Jika Stream Tidak Muncul:

1. **Cek MediaMTX berjalan:**
   ```bash
   curl -I http://localhost:8888/cam4/index.m3u8
   ```

2. **Cek koneksi RTSP:**
   ```bash
   ffmpeg -rtsp_transport tcp -i "rtsp://root:password@192.168.1.1:8000/Streaming/Channels/101" -t 5 -f null -
   ```

3. **Cek browser console untuk error HLS.js**

### Common Issues:

- **Error "HEVC PPS id out of range"**: Normal, MediaMTX akan tetap bekerja
- **Part duration warnings**: Normal untuk live streaming
- **404 on m3u8**: MediaMTX belum selesai convert atau RTSP tidak connect

## Architecture

```
RTSP Camera → MediaMTX → HLS Stream → React App (HLS.js) → Browser
```

1. **RTSP Camera** mengirim stream video
2. **MediaMTX** mengkonversi RTSP ke HLS format
3. **React App** menggunakan HLS.js untuk memutar stream
4. **Browser** menampilkan video

## Dependencies

- **MediaMTX v1.11.2**: RTSP to HLS converter
- **FFmpeg**: Video processing (untuk cam2 & cam3)
- **HLS.js v1.6.9**: JavaScript HLS player
- **React**: Frontend framework

## Network Requirements

- Port 8888: HLS server (MediaMTX)
- Port 8554: RTSP server (MediaMTX) 
- Port 3000: React dev server
- Access ke: 192.168.1.1:8000 (RTSP camera server)