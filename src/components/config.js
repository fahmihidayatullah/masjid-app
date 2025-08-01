const config = {
    youtubeUrl: process.env.REACT_APP_YOUTUBE_URL || '', // https://www.youtube.com/embed/whjQYLyk6yU?autoplay=1&mute=1 
    runningText: [
        "Masjid Al Muqorrobin menerima Infaq dan Shodaqoh Jama'ah melalui nomor rekening BSI: 7720004008 a.n. Masjid Al Muqorrobin",
        "Dan di hari Jum'at pahala bersedekah dilipatgandakan (HR. Ibnu Khuzaimah)."
    ],
    accessKeyUnsplash: process.env.REACT_APP_ACCESS_KEY_UNSPLASH || "PAhF0pYK4Xetg4uqAUcEdCwQFUqK6fvXM1Hs-1G4JMs",
    mosqueName: process.env.REACT_APP_MOSQUE_NAME || "Nama Masjid",
    iqomahTimes: {
        Subuh: process.env.REACT_APP_IQOMAH_TIME || 600,    // 10 menit
        Dzuhur: process.env.REACT_APP_IQOMAH_TIME || 600,   // 10 menit
        Ashar: process.env.REACT_APP_IQOMAH_TIME || 600,    // 10 menit
        Maghrib: process.env.REACT_APP_IQOMAH_TIME || 300,  // 5 menit
        Isya: process.env.REACT_APP_IQOMAH_TIME || 300      // 5 menit
    }
};

export default config;