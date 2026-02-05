// BackgroundDetectionService.js
// Service untuk menjalankan deteksi CCTV di background sesuai jadwal waktu sholat
// Tidak memerlukan halaman Deteksi.jsx terbuka

class BackgroundDetectionService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.detectionInterval = null;
    this.currentPrayerWindow = null;
    this.prayerSchedule = {};
    
    // Refs untuk tracking
    this.videoElement = null;
    this.canvasElement = null;
    this.detectionModel = null;
    this.detectedPersons = new Map();
    this.personTrajectories = new Map();
    this.personStates = new Map();
    this.personIdCounter = 0;
    this.lastSeen = new Map();
    
    // Detection lines dari localStorage
    this.detectionLines = this.loadDetectionLines();
    
    // Status callbacks
    this.statusCallbacks = [];
  }

  loadDetectionLines() {
    try {
      const saved = localStorage.getItem('detectionLines');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load detection lines:', e);
    }
    
    return {
      entry: {
        centerX: 0.5,
        centerY: 0.3,
        length: 0.8,
        angle: 0,
        color: '#00FF00',
        label: 'MASUK',
        zone: 'entry'
      },
      exit: {
        centerX: 0.5,
        centerY: 0.7,
        length: 0.8,
        angle: 0,
        color: '#FF0000',
        label: 'KELUAR',
        zone: 'exit'
      }
    };
  }

  // Register callback untuk status update
  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) this.statusCallbacks.splice(index, 1);
    };
  }

  emitStatus(status) {
    this.statusCallbacks.forEach(cb => {
      try {
        cb(status);
      } catch (e) {
        console.error('Status callback error:', e);
      }
    });
  }

  // Load prayer schedule from localStorage
  loadPrayerSchedule() {
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const saved = localStorage.getItem(`prayerTimes-${dateKey}`);
      
      if (saved) {
        const allTimes = JSON.parse(saved);
        return {
          Subuh: allTimes.Subuh || '04:30',
          Dzuhur: allTimes.Dzuhur || '12:00',
          Ashar: allTimes.Ashar || '15:15',
          Maghrib: allTimes.Maghrib || '18:00',
          Isya: allTimes.Isya || '19:15'
        };
      }
    } catch (e) {
      console.error('Failed to load prayer schedule:', e);
    }
    
    return {
      Subuh: '04:30',
      Dzuhur: '12:00',
      Ashar: '15:15',
      Maghrib: '18:00',
      Isya: '19:15'
    };
  }

  // Cek apakah saat ini dalam window waktu sholat
  checkPrayerWindow() {
    const now = new Date();
    const schedule = this.loadPrayerSchedule();
    
    for (const [prayerName, timeStr] of Object.entries(schedule)) {
      const [hh, mm] = timeStr.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hh, mm, 0, 0);
      
      let startTime, endTime;
      
      if (prayerName === 'Isya') {
        // Isya: 5 menit sebelum hingga 2 jam sesudah
        startTime = new Date(prayerTime.getTime() - 5 * 60 * 1000);
        endTime = new Date(prayerTime.getTime() + 2 * 60 * 60 * 1000);
      } else {
        // Lainnya: 1 jam sebelum hingga 1 jam sesudah
        startTime = new Date(prayerTime.getTime() - 60 * 60 * 1000);
        endTime = new Date(prayerTime.getTime() + 60 * 60 * 1000);
      }
      
      if (now >= startTime && now < endTime) {
        return {
          active: true,
          prayerName,
          startTime,
          endTime,
          prayerTime
        };
      }
    }
    
    return { active: false };
  }

  // Mulai service
  async start() {
    if (this.isRunning) {
      console.log('Background detection service already running');
      return;
    }
    
    console.log('🚀 Starting background detection service...');
    this.isRunning = true;
    
    // Load AI model
    await this.loadDetectionModel();
    
    // Setup hidden video and canvas elements
    this.setupHiddenElements();
    
    // Cek setiap 30 detik apakah dalam window waktu sholat
    this.checkInterval = setInterval(() => {
      const window = this.checkPrayerWindow();
      
      if (window.active && !this.currentPrayerWindow) {
        // Mulai window baru
        console.log(`✅ Prayer window started: ${window.prayerName}`);
        this.currentPrayerWindow = window;
        this.startDetection();
        this.emitStatus({ 
          running: true, 
          prayer: window.prayerName,
          startTime: window.startTime,
          endTime: window.endTime
        });
      } else if (!window.active && this.currentPrayerWindow) {
        // Window berakhir
        console.log(`⏹️ Prayer window ended: ${this.currentPrayerWindow.prayerName}`);
        this.stopDetection();
        this.currentPrayerWindow = null;
        this.emitStatus({ running: false });
      } else if (window.active) {
        // Update status
        this.emitStatus({ 
          running: true, 
          prayer: window.prayerName,
          startTime: window.startTime,
          endTime: window.endTime
        });
      }
    }, 30000); // Check every 30 seconds
    
    // Initial check
    const initialWindow = this.checkPrayerWindow();
    if (initialWindow.active) {
      this.currentPrayerWindow = initialWindow;
      this.startDetection();
      this.emitStatus({ 
        running: true, 
        prayer: initialWindow.prayerName,
        startTime: initialWindow.startTime,
        endTime: initialWindow.endTime
      });
    }
  }

  // Stop service
  stop() {
    console.log('⏹️ Stopping background detection service...');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.stopDetection();
    this.cleanupHiddenElements();
    this.emitStatus({ running: false });
  }

  // Load AI detection model
  async loadDetectionModel() {
    try {
      console.log('🔄 [Background] Loading TensorFlow.js...');
      // Load TensorFlow.js
      if (!window.tf) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs', 'tf');
      }
      console.log('✅ [Background] TensorFlow.js loaded');
      
      console.log('🔄 [Background] Loading COCO-SSD...');
      // Load COCO-SSD model
      if (!window.cocoSsd) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd', 'cocoSsd');
      }
      console.log('✅ [Background] COCO-SSD library loaded');
      
      console.log('🔄 [Background] Loading COCO-SSD model...');
      this.detectionModel = await window.cocoSsd.load();
      console.log('✅ [Background] Detection model ready');
    } catch (e) {
      console.error('❌ [Background] Failed to load detection model:', e);
    }
  }

  loadScript(src, checkGlobal) {
    return new Promise((resolve, reject) => {
      // Cek apakah global variable sudah ada
      if (checkGlobal && window[checkGlobal]) {
        resolve();
        return;
      }
      
      // Cek apakah script sudah ada di DOM
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        // Tunggu hingga global variable tersedia
        if (checkGlobal) {
          const checkInterval = setInterval(() => {
            if (window[checkGlobal]) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(checkInterval);
            if (window[checkGlobal]) {
              resolve();
            } else {
              reject(new Error(`${checkGlobal} not available after loading ${src}`));
            }
          }, 10000);
        } else {
          resolve();
        }
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        // Tunggu sebentar untuk memastikan library benar-benar tersedia
        if (checkGlobal) {
          const checkInterval = setInterval(() => {
            if (window[checkGlobal]) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(checkInterval);
            if (window[checkGlobal]) {
              resolve();
            } else {
              reject(new Error(`${checkGlobal} not available after loading ${src}`));
            }
          }, 5000);
        } else {
          resolve();
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Setup hidden video and canvas elements for background processing
  setupHiddenElements() {
    // Create hidden video element
    this.videoElement = document.createElement('video');
    this.videoElement.style.display = 'none';
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    this.videoElement.crossOrigin = 'anonymous'; // Fix CORS tainted canvas error
    document.body.appendChild(this.videoElement);
    
    // Create hidden canvas element
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.style.display = 'none';
    document.body.appendChild(this.canvasElement);
    
    // Load RTSP stream URL
    const rtspUrl = localStorage.getItem('rtspStreamUrl') || 'http://localhost:8888/cam4/index.m3u8';
    
    // Setup HLS player
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(rtspUrl);
      hls.attachMedia(this.videoElement);
      this.hlsInstance = hls;
    } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      this.videoElement.src = rtspUrl;
    }
    
    this.videoElement.play().catch(e => {
      console.error('Failed to play video:', e);
    });
  }

  cleanupHiddenElements() {
    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = null;
    }
    
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.remove();
      this.videoElement = null;
    }
    
    if (this.canvasElement) {
      this.canvasElement.remove();
      this.canvasElement = null;
    }
  }

  // Mulai deteksi
  startDetection() {
    if (this.detectionInterval) return;
    
    console.log('▶️ Starting detection loop...');
    
    // Run detection every 500ms
    this.detectionInterval = setInterval(() => {
      this.runDetection();
    }, 500);
  }

  // Stop deteksi
  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
      console.log('⏸️ Detection loop stopped');
    }
  }

  // Run detection frame
  async runDetection() {
    if (!this.detectionModel || !this.videoElement || !this.canvasElement) return;
    if (!this.videoElement.videoWidth || !this.videoElement.videoHeight) return;
    
    try {
      // Detect objects
      const predictions = await this.detectionModel.detect(this.videoElement);
      
      // Filter only persons
      const persons = predictions.filter(p => p.class === 'person' && p.score > 0.5);
      
      // Process detections
      this.processDetections(persons);
      
    } catch (e) {
      console.error('Detection error:', e);
    }
  }

  // Process detections and track persons
  processDetections(detections) {
    const now = Date.now();
    const TIMEOUT_MS = 2000;
    const IOU_THRESHOLD = 0.3;
    
    // Apply NMS
    const filteredDetections = this.applyNMS(detections, IOU_THRESHOLD);
    
    // Update existing persons or create new ones
    const matchedIds = new Set();
    
    filteredDetections.forEach(detection => {
      const [x, y, width, height] = detection.bbox;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      // Find matching person
      let bestMatch = null;
      let bestIoU = 0.2;
      
      this.detectedPersons.forEach((person, id) => {
        const iou = this.calculateIoU(detection.bbox, person.bbox);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestMatch = id;
        }
      });
      
      if (bestMatch !== null) {
        // Update existing person
        this.detectedPersons.set(bestMatch, {
          bbox: detection.bbox,
          center: { x: centerX, y: centerY },
          lastSeen: now
        });
        this.lastSeen.set(bestMatch, now);
        matchedIds.add(bestMatch);
        
        // Check line crossing
        this.checkLineCrossing(bestMatch, { x: centerX, y: centerY });
      } else {
        // Create new person
        const newId = this.personIdCounter++;
        this.detectedPersons.set(newId, {
          bbox: detection.bbox,
          center: { x: centerX, y: centerY },
          lastSeen: now
        });
        this.lastSeen.set(newId, now);
        matchedIds.add(newId);
      }
    });
    
    // Remove timed-out persons
    this.detectedPersons.forEach((person, id) => {
      if (now - person.lastSeen > TIMEOUT_MS) {
        this.detectedPersons.delete(id);
        this.lastSeen.delete(id);
        this.personTrajectories.delete(id);
        this.personStates.delete(id);
      }
    });
  }

  // Check line crossing
  checkLineCrossing(personId, currentCenter) {
    if (!this.currentPrayerWindow || !this.currentPrayerWindow.active) return;
    
    const videoWidth = this.videoElement.videoWidth;
    const videoHeight = this.videoElement.videoHeight;
    
    // Get trajectory
    let trajectory = this.personTrajectories.get(personId) || [];
    trajectory.push({
      x: currentCenter.x,
      y: currentCenter.y,
      timestamp: Date.now()
    });
    
    if (trajectory.length > 20) {
      trajectory.shift();
    }
    
    this.personTrajectories.set(personId, trajectory);
    
    if (trajectory.length < 3) return;
    
    // Get person state
    const currentState = this.personStates.get(personId) || {
      entryZone: 'unknown',
      exitZone: 'unknown',
      lastEntryTime: 0,
      lastExitTime: 0
    };
    
    // Check each line
    Object.entries(this.detectionLines).forEach(([lineKey, lineConfig]) => {
      const lineEndpoints = this.getLineEndpoints(lineConfig, videoWidth, videoHeight);
      const currentZone = this.determinePersonZone(currentCenter, lineEndpoints);
      const previousZone = currentState[`${lineConfig.zone}Zone`];
      
      if (previousZone !== 'unknown' && previousZone !== currentZone && currentZone !== 'on_line') {
        const now = Date.now();
        const lastCrossingTime = currentState[`last${lineConfig.zone.charAt(0).toUpperCase() + lineConfig.zone.slice(1)}Time`];
        
        if (now - lastCrossingTime > 2000) {
          if (this.validateCrossing(trajectory, lineEndpoints)) {
            if (lineConfig.zone === 'entry') {
              this.recordEntry();
            } else if (lineConfig.zone === 'exit') {
              this.recordExit();
            }
            currentState[`last${lineConfig.zone.charAt(0).toUpperCase() + lineConfig.zone.slice(1)}Time`] = now;
          }
        }
      }
      
      currentState[`${lineConfig.zone}Zone`] = currentZone;
    });
    
    this.personStates.set(personId, currentState);
  }

  // Record entry
  recordEntry() {
    const now = Date.now();
    
    // Update entry count
    const currentEntry = parseInt(localStorage.getItem('entryCount') || '0', 10);
    const newEntry = currentEntry + 1;
    localStorage.setItem('entryCount', String(newEntry));
    
    // Record prayer count
    const prayerName = this.currentPrayerWindow.prayerName;
    const dateKey = this.getTodayKey();
    const counts = this.loadPrayerCounts(dateKey);
    
    counts[prayerName] = (counts[prayerName] || 0) + 1;
    this.savePrayerCounts(dateKey, counts);
    
    // Update total
    const currentTotal = parseInt(localStorage.getItem('totalJamaahDetected') || '0', 10);
    localStorage.setItem('totalJamaahDetected', String(currentTotal + 1));
    
    console.log(`✅ Entry detected - Prayer: ${prayerName}, Count: ${counts[prayerName]}`);
    
    this.emitStatus({
      running: true,
      prayer: prayerName,
      entry: newEntry,
      prayerCounts: counts
    });
  }

  // Record exit
  recordExit() {
    const currentExit = parseInt(localStorage.getItem('exitCount') || '0', 10);
    const newExit = currentExit + 1;
    localStorage.setItem('exitCount', String(newExit));
    
    console.log(`✅ Exit detected - Count: ${newExit}`);
  }

  // Helper functions
  getTodayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadPrayerCounts(dateKey) {
    try {
      const raw = localStorage.getItem(`prayerCounts_${dateKey}`);
      if (!raw) {
        return { Subuh: 0, Dzuhur: 0, Ashar: 0, Maghrib: 0, Isya: 0 };
      }
      return JSON.parse(raw);
    } catch (e) {
      return { Subuh: 0, Dzuhur: 0, Ashar: 0, Maghrib: 0, Isya: 0 };
    }
  }

  savePrayerCounts(dateKey, counts) {
    try {
      localStorage.setItem(`prayerCounts_${dateKey}`, JSON.stringify(counts));
    } catch (e) {
      console.error('Failed to save prayer counts:', e);
    }
  }

  getLineEndpoints(line, videoWidth, videoHeight) {
    const centerX = line.centerX * videoWidth;
    const centerY = line.centerY * videoHeight;
    const halfLength = (line.length * Math.min(videoWidth, videoHeight)) / 2;
    
    const angleRad = (line.angle * Math.PI) / 180;
    const dx = halfLength * Math.cos(angleRad);
    const dy = halfLength * Math.sin(angleRad);
    
    return {
      x1: centerX - dx,
      y1: centerY - dy,
      x2: centerX + dx,
      y2: centerY + dy
    };
  }

  determinePersonZone(point, lineEndpoints) {
    const { x1, y1, x2, y2 } = lineEndpoints;
    const crossProduct = (x2 - x1) * (point.y - y1) - (y2 - y1) * (point.x - x1);
    const distance = Math.abs(crossProduct) / Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    
    if (distance < 20) return 'on_line';
    return crossProduct > 0 ? 'positive_side' : 'negative_side';
  }

  validateCrossing(trajectory, lineEndpoints) {
    if (trajectory.length < 5) return false;
    
    const recentPoints = trajectory.slice(-5);
    let crossingsDetected = 0;
    
    for (let i = 1; i < recentPoints.length; i++) {
      const p1 = recentPoints[i - 1];
      const p2 = recentPoints[i];
      
      if (this.lineSegmentIntersection(p1, p2, lineEndpoints)) {
        crossingsDetected++;
      }
    }
    
    const firstPoint = recentPoints[0];
    const lastPoint = recentPoints[recentPoints.length - 1];
    const totalMovement = Math.sqrt(
      (lastPoint.x - firstPoint.x) ** 2 + 
      (lastPoint.y - firstPoint.y) ** 2
    );
    
    return crossingsDetected >= 1 && totalMovement > 8;
  }

  lineSegmentIntersection(p1, p2, line) {
    const { x1, y1, x2, y2 } = line;
    const denom = (x1 - x2) * (p1.y - p2.y) - (y1 - y2) * (p1.x - p2.x);
    if (Math.abs(denom) < 0.001) return false;
    
    const t = ((x1 - p1.x) * (p1.y - p2.y) - (y1 - p1.y) * (p1.x - p2.x)) / denom;
    const u = -((x1 - x2) * (y1 - p1.y) - (y1 - y2) * (x1 - p1.x)) / denom;
    
    return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
  }

  calculateIoU(boxA, boxB) {
    const [x1A, y1A, wA, hA] = boxA;
    const [x1B, y1B, wB, hB] = boxB;
    
    const x2A = x1A + wA;
    const y2A = y1A + hA;
    const x2B = x1B + wB;
    const y2B = y1B + hB;

    const xA = Math.max(x1A, x1B);
    const yA = Math.max(y1A, y1B);
    const xB = Math.min(x2A, x2B);
    const yB = Math.min(y2A, y2B);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = wA * hA;
    const boxBArea = wB * hB;
    const unionArea = boxAArea + boxBArea - interArea;

    return unionArea > 0 ? interArea / unionArea : 0;
  }

  applyNMS(detections, iouThreshold = 0.3) {
    if (detections.length === 0) return [];

    const result = [];
    const sorted = [...detections].sort((a, b) => b.score - a.score);

    while (sorted.length > 0) {
      const current = sorted.shift();
      
      const [x, y, width, height] = current.bbox;
      const aspectRatio = width / height;
      
      if (width > 200 && aspectRatio > 1.8) {
        continue;
      }
      
      result.push(current);

      for (let i = sorted.length - 1; i >= 0; i--) {
        const iou = this.calculateIoU(current.bbox, sorted[i].bbox);
        if (iou > iouThreshold) {
          sorted.splice(i, 1);
        }
      }
    }

    return result;
  }
}

// Create singleton instance
const backgroundDetectionService = new BackgroundDetectionService();

export default backgroundDetectionService;
