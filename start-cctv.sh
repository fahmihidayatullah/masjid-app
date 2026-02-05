#!/bin/bash

echo "🎥 Starting MediaMTX RTSP to HLS Converter..."

# Check if mediamtx binary exists
if [ ! -f "./mediamtx" ]; then
    echo "❌ MediaMTX binary not found!"
    echo "📥 Downloading MediaMTX..."
    curl -L https://github.com/bluenviron/mediamtx/releases/download/v1.11.2/mediamtx_v1.11.2_darwin_arm64.tar.gz -o mediamtx.tar.gz
    tar -xzf mediamtx.tar.gz
    chmod +x mediamtx
    echo "✅ MediaMTX downloaded and installed!"
fi

# Check if custom config exists
if [ ! -f "./mediamtx-custom.yml" ]; then
    echo "❌ Custom configuration not found! Creating default config..."
    cat > mediamtx-custom.yml << EOF
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
    runOnInit: ffmpeg -loglevel warning -rtsp_transport tcp -i rtsp://username:password@IP_ADDRESS:PORT/Streaming/Channels/202 -c:v copy -an -f rtsp rtsp://localhost:\$RTSP_PORT/\$MTX_PATH
    runOnInitRestart: yes
  
  cam3:
    runOnInit: ffmpeg -loglevel warning -rtsp_transport tcp -i rtsp://username:password@IP_ADDRESS:PORT/Streaming/Channels/302 -c:v copy -an -f rtsp rtsp://localhost:\$RTSP_PORT/\$MTX_PATH
    runOnInitRestart: yes
  
  cam4:
    source: rtsp://username:password@IP_ADDRESS:PORT/Streaming/Channels/401
    rtspTransport: tcp
    sourceOnDemand: no
EOF
    echo "✅ Default configuration created!"
fi

echo "🚀 Starting MediaMTX with CCTV configuration..."
echo "📊 Access streams at (via nginx proxy if in Docker):"
echo "   • Cam1: http://localhost:8888/cam1/index.m3u8  (atau /stream/cam1/index.m3u8 via nginx)"
echo "   • Cam2: http://localhost:8888/cam2/index.m3u8  (atau /stream/cam2/index.m3u8 via nginx)"
echo "   • Cam3: http://localhost:8888/cam3/index.m3u8  (atau /stream/cam3/index.m3u8 via nginx)"
echo "   • Cam4: http://localhost:8888/cam4/index.m3u8  (atau /stream/cam4/index.m3u8 via nginx)"
echo ""
echo "🌐 Open the web app at: http://localhost:3000 (atau http://localhost:8091 jika via nginx proxy)"
echo "⏹️  Press Ctrl+C to stop"
echo ""


# --- Ambil nilai koneksi RTSP dari mediamtx-custom.yml ---
YAML_FILE="mediamtx-custom.yml"

get_rtsp_info() {
  grep -A1 "$1:" "$YAML_FILE" | grep 'rtsp://' | \
    sed -E "s/.*rtsp:\/\/(.*):(.*)@(.*):(.*)\/Streaming.*/username: \1\npassword: \2\nip: \3\nport: \4/"
}

echo "\n=== Nilai koneksi RTSP dari $YAML_FILE ==="
for cam in cam1 cam2 cam3 cam4; do
  echo "[$cam]"
  get_rtsp_info "$cam"
  echo ""
done

./mediamtx ./mediamtx-custom.yml