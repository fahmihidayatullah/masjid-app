const config = {
    youtubeUrl: import.meta.env.VITE_YOUTUBE_URL || '', // https://www.youtube.com/embed/whjQYLyk6yU?autoplay=1&mute=1 
    streamUrl: import.meta.env.VITE_STREAM_URL || '', // https://www.youtube.com/embed/whjQYLyk6yU?autoplay=1&mute=1
    runningText: import.meta.env.VITE_RUNNING_TEXT ? import.meta.env.VITE_RUNNING_TEXT.split('|') : [  // pisahkan dengan '|'
        "Masjid Al Muqorrobin menerima Infaq dan Shodaqoh Jama'ah melalui nomor rekening BSI: 7720004008 a.n. Masjid Al Muqorrobin",
        "Dan di hari Jum'at pahala bersedekah dilipatgandakan (HR. Ibnu Khuzaimah)."
    ],
    accessKeyUnsplash: import.meta.env.VITE_ACCESS_KEY_UNSPLASH || "PAhF0pYK4Xetg4uqAUcEdCwQFUqK6fvXM1Hs-1G4JMs",
    mosqueName: import.meta.env.VITE_MOSQUE_NAME || "Nama Masjid",
    iqomahTimes: {
        Subuh: import.meta.env.VITE_IQOMAH_TIME || 600,    // 10 menit
        Dzuhur: import.meta.env.VITE_IQOMAH_TIME || 600,   // 10 menit
        Ashar: import.meta.env.VITE_IQOMAH_TIME || 600,    // 10 menit
        Maghrib: import.meta.env.VITE_IQOMAH_TIME || 300,  // 5 menit
        Isya: import.meta.env.VITE_IQOMAH_TIME || 300      // 5 menit
    }
};

export default config;