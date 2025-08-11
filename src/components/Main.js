import React, { useRef, useState, useEffect } from 'react';
import '../styles/Main.css';
import config from './config';
import moment from 'moment-hijri';
// import kajianImage from '../assets/kajian.jpeg'; // Import kajian poster image
import 'moment/locale/id'; // Import Indonesian locale for moment.js

const Main = ({ mosqueName, onPrayerTime, runningText, setCurrentPage, iqomahTimes }) => {
    const [currentBackground, setCurrentBackground] = useState('youtube');
    // Poster kajian, bisa diisi dari localStorage atau hardcode
    const [kajianPoster, setKajianPoster] = useState(() => {
        // Coba ambil dari localStorage, jika tidak ada pakai hardcode Google Drive
        return (
            localStorage.getItem('kajianPoster') ||
            ''
        );
    });
    const [unsplashImage, setUnsplashImage] = useState(''); // State to store Unsplash image URL
    const [dailyContent, setDailyContent] = useState(null); // State to store daily ayat or hadith
    const [khatibData, setKhatibData] = useState({}); // State to store khatib data, default objek kosong
    const [accessKey] = useState(config.accessKeyUnsplash);
    const [youtubeUrl] = useState(
        localStorage.getItem('youtubeUrl') || ''
    );
    
    // Use refs to access latest values in interval
    const khatibDataRef = useRef(khatibData);
    const youtubeUrlRef = useRef(youtubeUrl);
    
    // Update refs when state changes
    useEffect(() => {
        khatibDataRef.current = khatibData;
    }, [khatibData]);
    
    useEffect(() => {
        youtubeUrlRef.current = youtubeUrl;
    }, [youtubeUrl]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const isFriday = currentTime.getDay() === 5; // 5 = Jum'at
    
    // Function to check if khatib date is Friday
    const isKhatibDateFriday = (data = khatibData) => {
        if (data?.tanggal) {
            try {
                const khatibDate = new Date(data.tanggal);
                return khatibDate.getDay() === 5; // 5 = Friday
            } catch (error) {
                console.error('Error parsing khatib date:', error);
                // Fallback to current day if date parsing fails
                return currentTime.getDay() === 5;
            }
        }
        // Fallback to current day if no khatib date is set
        return currentTime.getDay() === 5;
    };
    const [timeToNextPrayer, setTimeToNextPrayer] = useState('');
    const [nameToNextPrayer, setNameToNextPrayer] = useState('');
    const [prayerTimes, setPrayerTimes] = useState({}); // State for prayer times
    const [currentDate, setCurrentDate] = useState({
        hijriyah: moment().format('iD/iM/iYYYY'), // Hijri date
        masehi: moment().format('DD-MM-YYYY'), // Gregorian date
    });
    const [photographer, setPhotographer] = useState(null); // State to store photographer
    
    // Helper function to check if khatib data is valid
    const isKhatibDataValid = (data) => {
        return data && typeof data === 'object' && (data.nama || data.tema || data.tanggal);
    };
    
    const hijriMonthsLatin = [
    "Muharram",
    "Safar",
    "Rabiul Awal",
    "Rabiul Akhir",
    "Jumadil Awal",
    "Jumadil Akhir",
    "Rajab",
    "Syaban",
    "Ramadhan",
    "Syawwal",
    "Dzulqaidah",
    "Dzulhijjah"
    ];

    function getHijriLatin() {
    const iDate = moment();
    const day = iDate.iDate();
    const month = hijriMonthsLatin[iDate.iMonth()];
    const year = iDate.iYear();
    return `${day} ${month} ${year}`;
    }

    useEffect(() => {
        // Update the date every second
        const updateDate = () => {
            moment.locale('id'); // set locale ke Indonesia
            const masehiDate = moment().format('dddd, DD MMMM YYYY'); // Tanggal masehi dalam bahasa Indonesia
            // Format Hijriyah dengan angka latin dan nama bulan latin
            const hijriyahDate = getHijriLatin();
            setCurrentDate({ masehi: masehiDate, hijriyah: hijriyahDate });
        };

        updateDate(); // Initial update
        const timer = setInterval(updateDate, 1000); // Update every second

        return () => clearInterval(timer); // Cleanup interval on component unmount
    }, []);

    const fetchPrayerTimes = async (date) => {
    try {
        // Cek localStorage dulu
        const localKey = `prayerTimes-${date}`;
        const saved = localStorage.getItem(localKey);
        if (saved) {
            setPrayerTimes(JSON.parse(saved));
            return;
        }

        // Jika belum ada di localStorage, fetch dari API
        const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/1301/${date}`);
        const data = await response.json();

        if (data && data.data && data.data.jadwal) {
            const jadwal = data.data.jadwal;
            const times = {
                Subuh: jadwal.subuh,
                Terbit: jadwal.terbit,
                Dhuha: jadwal.dhuha,
                Dzuhur: jadwal.dzuhur,
                Ashar: jadwal.ashar,
                Maghrib: jadwal.maghrib,
                Isya: jadwal.isya,
            };
            setPrayerTimes(times);
            localStorage.setItem(localKey, JSON.stringify(times));
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
    }
};

    useEffect(() => {
        // Fetch a random image from Unsplash
        const fetchUnsplashImage = async () => {
            try {
                const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
                const savedImage = localStorage.getItem('unsplashImage');
                const savedDate = localStorage.getItem('unsplashImageDate');
                const savedPhotographer = JSON.parse(localStorage.getItem('unsplashPhotographer'));
                if (savedImage && savedDate === today) {
                    // Use the saved image if it's from today
                    setUnsplashImage(savedImage);
                    setPhotographer(savedPhotographer); // Restore photographer info
                } else {
                    // Fetch a new image if there's no saved image or it's not from today
                    const response = await fetch(
                        `https://api.unsplash.com/photos/random?query=mosque&orientation=landscape&client_id=${accessKey}`
                    );
                    const data = await response.json();
                    await fetch(`${data.links.download_location}?client_id=${accessKey}`);

                    setUnsplashImage(data.urls.full); // Set the image URL from Unsplash
                    const photographerInfo = { name: data.user.name, link: data.user.links.html };
                    setPhotographer(photographerInfo); // Save photographer info
                    localStorage.setItem('unsplashImage', data.urls.full); // Save the image URL to localStorage
                    localStorage.setItem('unsplashImageDate', today); // Save today's date to localStorage
                    localStorage.setItem('unsplashPhotographer', JSON.stringify(photographerInfo)); // Save photographer info to localStorage
                }
            } catch (error) {
                console.error('Error fetching Unsplash image:', error);
            }
        };

        // Pilih daily content saat component mount
        const randomIndex = Math.floor(Math.random() * contentList.length);
        setDailyContent(contentList[randomIndex]);

        // Load khatib data dari localStorage
        const loadKhatibData = () => {
            const savedKhatib = localStorage.getItem('khatibData');
            if (savedKhatib) {
                try {
                    const parsedData = JSON.parse(savedKhatib);
                    // Pastikan URL foto sudah dalam format yang benar untuk Google Drive
                    if (parsedData.foto && parsedData.foto.includes('drive.google.com/file/d/')) {
                        const drivePattern = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
                        const match = parsedData.foto.match(drivePattern);
                        if (match && !parsedData.foto.includes('thumbnail?id=')) {
                            const fileId = match[1];
                            parsedData.foto = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                        }
                    }
                    // Pastikan posisi default tersedia untuk data lama
                    if (parsedData.positionX === undefined) parsedData.positionX = 50;
                    if (parsedData.positionY === undefined) parsedData.positionY = 50;
                    setKhatibData(parsedData);
                } catch (error) {
                    console.error('Error parsing khatib data:', error);
                    setKhatibData({}); // fallback objek kosong jika error
                }
            } else {
                setKhatibData({}); // fallback objek kosong jika tidak ada data
            }
        };

        loadKhatibData();
        fetchUnsplashImage(); // Fetch image on component mount

        const interval = setInterval(() => {
            setCurrentBackground((prev) => {

                if (prev === 'youtube') {
                    fetchUnsplashImage();
                    // Pilih daily content baru setiap kali masuk ke unsplash
                    const randomIndex = Math.floor(Math.random() * contentList.length);
                    setDailyContent(contentList[randomIndex]);
                }
                // Jika youtubeUrl kosong, langsung ke unsplash
                if (!youtubeUrl) {
                    fetchUnsplashImage();
                    // Pilih daily content baru setiap kali masuk ke unsplash
                    const randomIndex = Math.floor(Math.random() * contentList.length);
                    setDailyContent(contentList[randomIndex]);
                    return 'unsplash';
                } else if (prev === 'unsplash') {
                    // Setelah unsplash, tampilkan poster kajian jika ada, jika tidak lanjut ke khatib/youtube
                    if (isKhatibDataValid(khatibDataRef.current)) {
                        return 'khatib';
                    } else {
                        return youtubeUrlRef.current ? 'youtube' : 'unsplash';
                    }
                } else if (prev === 'kajian') {
                    // Setelah poster kajian, lanjut ke khatib jika ada data, jika tidak ke youtube/unsplash
                    if (isKhatibDataValid(khatibDataRef.current)) {
                        return 'khatib';
                    } else {
                        return youtubeUrlRef.current ? 'youtube' : 'unsplash';
                    }
                } else if (prev === 'khatib') {
                    return youtubeUrlRef.current ? 'youtube' : 'unsplash';
                }
                return 'unsplash';
            });
        }, 1 * 15 * 1000); // Switch background every 15 seconds (for testing, change back to 5 * 60 * 1000 for production)

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []);

    // Fetch prayer times from API
    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero
        const day = String(today.getDate()).padStart(2, '0'); // Add leading zero
        const todaydate = `${year}-${month}-${day}`;

        fetchPrayerTimes(todaydate);
    }, []); // Run once on component mount

    const contentList = [
        { type: "ayat", text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Sesungguhnya bersama kesulitan ada kemudahan.",  source: "(QS. Al-Insyirah: 6)" },
        { type: "ayat", text: "وَأَقِمِ ٱلصَّلَوٰةَ إِنَّ ٱلصَّلَوٰةَ تَنْهَىٰ عَنِ ٱلْفَحْشَآءِ وَٱلْمُنكَرِ", translation: "Dirikanlah sholat, karena sholat mencegah dari perbuatan keji dan mungkar.",  source: "(QS. Al-‘Ankabut: 45)" },
        { type: "ayat", text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", translation: "Tunjukilah kami jalan yang lurus.",  source: "(QS. Al-Fatihah: 6)" },
        { type: "ayat", text: "فَاذْكُرُونِي أَذْكُرْكُمْ", translation: "Ingatlah kepada-Ku, niscaya Aku ingat (pula) kepadamu.",  source: "(QS. Al-Baqarah: 152)" },
        { type: "ayat", text: "يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ", translation: "Wahai orang-orang yang beriman! Mohonlah pertolongan dengan sabar dan shalat.",  source: "(QS. Al-Baqarah: 153)"},
        { type: "hadist", text: "الدِّينُ النَّصِيحَةُ", translation: "Agama adalah nasihat.",  source: "(HR. Muslim)" },
        { type: "hadist", text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", translation: "Sesungguhnya setiap amal tergantung pada niatnya.",  source: "(HR. Bukhari & Muslim)" },
        { type: "hadist", text: "مَنْ لاَ يَرْحَمْ لاَ يُرْحَمْ", translation: "Barangsiapa tidak menyayangi, maka tidak akan disayangi.",  source: "(HR. Bukhari)" },
        { type: "hadist", text: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ", translation: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.",  source: "(HR. Ahmad)" },
        { type: "hadist", text: "سَبْعَةٌ يُظِلُّهُمُ اللَّهُ فِي ظِلِّهِ...", translation: "Ada tujuh golongan yang Allah naungi di hari tiada naungan selain naungan-Nya.",  source: "(HR. Bukhari & Muslim)" }
    ];

    // Update the current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer); // Cleanup interval on component unmount
    }, []);

    // Check if 'Now' matches any prayer time and has an Iqomah
    useEffect(() => {
        const now = currentTime.toTimeString().slice(0, 5); // Format current time as HH:mm
        const prayerName = Object.keys(prayerTimes).find(
            (key) => prayerTimes[key] === now
        );

        if (prayerName && (iqomahTimes[prayerName] || 0)> 0) {
            onPrayerTime(prayerName, iqomahTimes[prayerName]); // Call the function when 'Now' matches a prayer time with Iqomah
        }
    }, [currentTime, onPrayerTime, prayerTimes, iqomahTimes]);

    // Calculate time to the next prayer
    useEffect(() => {
        const now = currentTime.toTimeString().slice(0, 5); // Format current time as HH:mm
        const times = Object.values(prayerTimes);
        const names = Object.keys(prayerTimes);
        let nextPrayerTime = null;
        let nextPrayerName = "";
        let addDate = 0;

        for (let i = 0; i < times.length; i++) {
            if (now < times[i]) {
                nextPrayerTime = times[i];
                nextPrayerName = names[i];
                break;
            }
        }

        if (!nextPrayerTime) {
            // If no next prayer today, use the first prayer time tomorrow
            nextPrayerTime = times[0];
            nextPrayerName = names[0];
            addDate = 1; // Add one day to the current date
        }

        if (nextPrayerTime) {
            // Calculate the difference in time
            const [nextHour, nextMinute] = nextPrayerTime.split(':').map(Number); // Ensure nextPrayerTime is valid
            const nextPrayerDate = new Date(currentTime);
            nextPrayerDate.setDate(currentTime.getDate() + addDate); // Set the date to tomorrow if needed
            nextPrayerDate.setHours(nextHour, nextMinute, 0, 0);

            const diff = nextPrayerDate - currentTime;
            let totalSeconds = Math.ceil(diff / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            setTimeToNextPrayer(
                `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`
            );

            setNameToNextPrayer(nextPrayerName);
        }
    }, [currentTime, prayerTimes]);

    // Determine the position of the current time and shift prayer times
    const getShiftedPrayerTimes = () => {
        const times = Object.entries(prayerTimes); // Convert prayer times to an array of [key, value]
        const now = currentTime.toTimeString().slice(0, 5); // Format current time as HH:mm

        // Find the index of the next prayer time
        let inserted = false;
        for (let i = 0; i < times.length; i++) {
            if (now < times[i][1]) {
                inserted = true;
                times.splice(i, 0, ['now', now]);
                break;
            }
        }

        // If 'Now' is after the last prayer time, add it to the beginning
        if (!inserted) {
            times.splice(0, 0, ['now', now]);
        }

        return times;
    };

    useEffect(() => {
    // Jika waktu sudah melewati semua jadwal hari ini, fetch jadwal besok
    const times = Object.entries(prayerTimes);
    const now = currentTime.toTimeString().slice(0, 5);
    const lastTime = times.length ? times[times.length - 1][1] : null;

    if (lastTime && now > lastTime) {
        const tomorrow = new Date(currentTime);
        tomorrow.setDate(currentTime.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowDate = `${year}-${month}-${day}`;
        fetchPrayerTimes(tomorrowDate);
    }
}, [currentTime, prayerTimes]);

    const shiftedPrayerTimes = getShiftedPrayerTimes();

    // Use runningText from props or default array
    const runningTexts = runningText && runningText.length > 0 ? runningText : [
        "Masjid Al Muqorrobin menerima Infaq dan Shodaqoh Jama'ah melalui nomor rekening BSI: 7720004008 a.n. Masjid Al Muqorrobin"
    ];

    const [runningTextIndex, setRunningTextIndex] = useState(0);
    const [animateKey, setAnimateKey] = useState(0);

    useEffect(() => {
    // Hitung durasi animasi berdasarkan panjang teks (misal: 0.12s per karakter, min 6s, max 20s)
    const textLength = runningTexts[runningTextIndex]?.length || 0;
    const duration = Math.min(Math.max(textLength * 200, 10000), 30000);

    // Set animasi CSS variable
    if (carouselRef.current) {
        carouselRef.current.style.setProperty('--running-text-duration', `${duration}ms`);
    }

    // Timer untuk ganti teks setelah animasi selesai
    const timer = setTimeout(() => {
        setRunningTextIndex(prev => (prev + 1) % runningTexts.length);
        setAnimateKey(prev => prev + 1); // paksa re-render span agar animasi ulang
    }, duration);

    return () => clearTimeout(timer);
}, [runningTextIndex, runningTexts.length]);

    const [isOverflow, setIsOverflow] = useState(false);
    const carouselRef = useRef(null);

    useEffect(() => {
        const checkOverflow = () => {
            if (carouselRef.current) {
                // setIsOverflow(carouselRef.current.scrollWidth > carouselRef.current.clientWidth);
                carouselRef.current.scrollLeft = 0; // Reset scroll position to the start
            }
        };
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [runningTexts, runningTextIndex]);

    return (
        <div className="main-tv-container">
            <div className="main-mosque-header">
            <div className="main-header-date">
                <div className="main-current-masehi">{currentDate.masehi} M</div>
                <div className="main-current-hijriyah">{currentDate.hijriyah} H</div>
            </div>
            <div className="main-mosque-name-area">{mosqueName}</div>
            <div className="main-header-time">
                <span className="main-header-hourmin">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="main-header-second">
                    {currentTime
                        .getSeconds()
                        .toString()
                        .padStart(2, '0')}
                </span>
                <button
                    className="close-header-btn"
                    onClick={() => setCurrentPage && setCurrentPage('welcome')}
                    title="Kembali ke Home"
                >
                    X
                </button>
            </div>
        </div>

            {/* Content Area */}
            <div className="main-content-area">
                <div className="main-background-container">
                    {currentBackground === 'youtube' && youtubeUrl && (
                        <iframe
                            src={youtubeUrl}
                            title="Makkah Live Stream"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="main-youtube-iframe"
                        />
                    )}
                    {((currentBackground === 'unsplash') || (currentBackground === 'youtube' && !youtubeUrl)) && unsplashImage && (
                        <div className="main-unsplash-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <img
                                src={unsplashImage}
                                alt="Unsplash Mosque"
                                className="main-unsplash-image"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {dailyContent && (
                                <div className="main-daily-content-overlay">
                                    <div className="main-daily-content-arab">{dailyContent.text}</div>
                                    <div className="main-daily-content-translation">{dailyContent.translation}</div>
                                    <div className="main-daily-content-source">{dailyContent.source}</div>
                                </div>
                            )}
                            {photographer && (
                                <div className="main-unsplash-photographer">
                                    Photo by <a href={photographer.link} target="_blank" rel="noopener noreferrer">{photographer.name}</a> on Unsplash
                                </div>
                            )}
                        </div>
                    )}
                    {currentBackground === 'kajian' && kajianPoster && (
                        <div className="main-kajian-poster-wrapper" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', position: 'relative' }}>
                            <img
                                src={kajianPoster}
                                alt="Poster Kajian"
                                style={{
                                    maxWidth: '90%',
                                    maxHeight: '90%',
                                    borderRadius: '20px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                                    border: '4px solid #fff',
                                    background: '#fff',
                                    objectFit: 'contain'
                                }}
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}
                    {currentBackground === 'khatib' && (
                        <div className="main-khatib-poster" style={{ 
                            width: '100%', 
                            height: '100%', 
                            backgroundImage: unsplashImage ? `url(${unsplashImage})` : 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                            textAlign: 'center',
                            padding: '40px',
                            position: 'relative',
                            minHeight: '100%'
                        }}>
                            {/* Debug info */}
                            {console.log('Rendering khatib page with data:', khatibData, 'tanggal:', khatibData?.tanggal, 'isKhatibDateFriday:', isKhatibDateFriday())}
                            {/* Dark overlay for better text readability - only if using unsplash image */}
                            {unsplashImage && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    zIndex: 1
                                }}></div>
                            )}
                            <div style={{ 
                                background: 'rgba(255,255,255,0.15)', 
                                padding: '60px', 
                                borderRadius: '20px',
                                backdropFilter: 'blur(15px)',
                                border: '2px solid rgba(255,255,255,0.3)',
                                maxWidth: '800px',
                                width: '100%',
                                position: 'relative',
                                zIndex: 2
                            }}>
                                <h1 style={{ 
                                    fontSize: '4rem', 
                                    marginBottom: '30px',
                                    textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                                    fontWeight: 'bold'
                                }}>
                                    {isKhatibDateFriday() ? 'Khotbah Jum\'at' : 'Ustadz Hari Ini'}
                                </h1>
                                {/* Tampilkan tanggal khatib jika ada, atau tanggal hari ini */}
                                <div style={{ 
                                    fontSize: khatibData?.tanggal ? '1.8rem' : '1.5rem', 
                                    marginBottom: '20px',
                                    color: khatibData?.tanggal ? '#FFD700' : 'rgba(255,215,0,0.7)',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    fontWeight: 'bold',
                                    fontStyle: khatibData?.tanggal ? 'normal' : 'italic'
                                }}>
                                    {khatibData?.tanggal ? (
                                        new Date(khatibData.tanggal).toLocaleDateString('id-ID', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })
                                    ) : (
                                        `${currentTime.toLocaleDateString('id-ID', { 
                                            weekday: 'long', 
                                            day: 'numeric',
                                            month: 'long'
                                        })}`
                                    )}
                                </div>
                                {/* Foto Khatib - hanya tampil jika ada foto */}
                                {khatibData?.foto && (
                                    <div style={{ 
                                        marginBottom: '30px',
                                        display: 'flex',
                                        justifyContent: 'center'
                                    }}>
                                        <img 
                                            src={khatibData.foto} 
                                            alt="Foto Khatib"
                                            style={{
                                                width: '200px',
                                                height: '200px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                objectPosition: `${khatibData.positionX || 50}% ${khatibData.positionY || 50}%`,
                                                border: '5px solid white',
                                                boxShadow: '0 8px 25px rgba(0,0,0,0.5)'
                                            }}
                                            onError={(e) => {
                                                if (khatibData.foto.includes('drive.google.com')) {
                                                    const drivePattern = /\/id\/([a-zA-Z0-9_-]+)/;
                                                    const match = khatibData.foto.match(drivePattern) || 
                                                                khatibData.foto.match(/file\/d\/([a-zA-Z0-9_-]+)/);
                                                    if (match) {
                                                        const fileId = match[1];
                                                        const altFormats = [
                                                            `https://drive.google.com/uc?id=${fileId}`,
                                                            `https://drive.google.com/uc?export=view&id=${fileId}`,
                                                            `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`,
                                                            `https://lh3.googleusercontent.com/d/${fileId}=w1000`
                                                        ];
                                                        for (const altUrl of altFormats) {
                                                            if (altUrl !== khatibData.foto) {
                                                                e.target.src = altUrl;
                                                                return;
                                                            }
                                                        }
                                                    }
                                                }
                                                e.target.style.display = 'none';
                                            }}
                                            onLoad={(e) => {
                                                // Photo loaded successfully
                                            }}
                                        />
                                    </div>
                                )}
                                <h2 style={{ 
                                    fontSize: '3rem', 
                                    marginBottom: '20px',
                                    color: '#FFD700',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    fontWeight: 'bold'
                                }}>
                                    {khatibData?.nama ? khatibData.nama : <span style={{color:'#fff'}}>Nama Khatib belum diisi</span>}
                                </h2>
                                <div style={{ 
                                    fontSize: '2rem', 
                                    marginBottom: '30px',
                                    fontWeight: 'bold',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                                }}>
                                    {isKhatibDateFriday() ? 'Tema:' : 'Materi:'}
                                </div>
                                <div style={{ 
                                    fontSize: '2.5rem', 
                                    fontStyle: 'italic',
                                    lineHeight: '1.4',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    fontWeight: '500'
                                }}>
                                    "{khatibData?.tema ? khatibData.tema : (isKhatibDateFriday() ? 'Tema Khotbah belum diisi' : 'Materi belum diisi')}"
                                </div>
                            </div>
                            {/* Photographer credit - positioned at bottom right - only show if using unsplash image */}
                            {photographer && unsplashImage && (
                                <div style={{ 
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '15px',
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.8)',
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    zIndex: 2
                                }}>
                                    Photo by <a href={photographer.link} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.9)' }}>{photographer.name}</a> on Unsplash
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="main-prayer-times-grid-container">
                    {shiftedPrayerTimes.map(([prayer, time], idx) => (
                    <div
                        key={prayer}
                        className={`main-prayer-times-grid-box${prayer === 'now' ? ' main-current-time-box' : ''}`}
                    >
                        {prayer === 'now' ? (
                        <div>
                            <div>Next: {isFriday && nameToNextPrayer === 'Dzuhur' ? "Jum'at" : nameToNextPrayer}</div>
                            <div>{timeToNextPrayer}</div>
                        </div>
                        ) : (
                        <>
                            {isFriday && prayer === 'Dzuhur' ? "Jum'at" : prayer}: {time}
                        </>
                        )}
                    </div>
                    ))}
                </div>
            </div>

            <div className="main-running-text-container">
                <div
                    className="main-running-carousel-text animate-carousel"
                    ref={carouselRef}
                >
                    <span
                    key={animateKey}
                    style={{
                        animationDuration: `var(--running-text-duration, 20000ms)`
                    }}
                    >
                    {runningTexts[runningTextIndex]}
                    </span>
                </div>
                </div>
        </div>
    );
};

export default Main;