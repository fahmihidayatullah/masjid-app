// Service untuk counting jamaah berjalan di background sesuai window waktu sholat
// Counting tetap berjalan meski halaman Deteksi.jsx tidak dibuka

class DeteksiService {
  constructor() {
    this.isActive = false;
    this.timer = null;
    this.listeners = [];
    this.currentPrayer = null;
    this.crossingHandler = null; // function to call when crossing detected
  }

  // Set handler untuk crossing event (misal: dari deteksi kamera/AI)
  setCrossingHandler(fn) {
    this.crossingHandler = fn;
  }

  // Register listener untuk update (misal: update UI)
  onUpdate(fn) {
    this.listeners.push(fn);
  }

  emitUpdate(data) {
    this.listeners.forEach(fn => fn(data));
  }

  // Cek apakah sekarang dalam window counting untuk salah satu sholat
  getActivePrayerWindow(prayerSchedule) {
    const now = new Date();
    for (const [prayer, timeStr] of Object.entries(prayerSchedule)) {
      const [hh, mm] = timeStr.split(":").map(Number);
      const base = new Date();
      base.setHours(hh, mm, 0, 0);
      let start, end;
      if (prayer === "Isya") {
        start = new Date(base.getTime() - 5 * 60 * 1000);
        end = new Date(base.getTime() + 2 * 60 * 60 * 1000);
      } else {
        start = new Date(base.getTime() - 60 * 60 * 1000);
        end = new Date(base.getTime() + 60 * 60 * 1000);
      }
      if (now >= start && now < end) {
        return { prayer, start, end };
      }
    }
    return null;
  }

  // Mulai service (dipanggil sekali saat app start)
  start(prayerSchedule) {
    if (this.isActive) return;
    this.isActive = true;
    this.timer = setInterval(() => {
      const window = this.getActivePrayerWindow(prayerSchedule);
      if (window) {
        this.currentPrayer = window.prayer;
        // Di sini bisa trigger crossingHandler jika ada event crossing
        // Atau polling data dari kamera/AI
        this.emitUpdate({ active: true, prayer: window.prayer, start: window.start, end: window.end });
      } else {
        this.currentPrayer = null;
        this.emitUpdate({ active: false });
      }
    }, 10000); // cek setiap 10 detik
  }

  stop() {
    this.isActive = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.currentPrayer = null;
  }
}

const deteksiService = new DeteksiService();
export default deteksiService;
