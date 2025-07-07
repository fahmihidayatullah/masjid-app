import React, { useRef, useState, useEffect } from 'react';
import '../styles/Main.css';
import config from './config';
import moment from 'moment-hijri';
import 'moment/locale/id'; // Import Indonesian locale for moment.js

const Main = ({ mosqueName, onPrayerTime, runningText, setCurrentPage, iqomahTimes }) => {
    const [currentBackground, setCurrentBackground] = useState('youtube');
    const [unsplashImage, setUnsplashImage] = useState(''); // State to store Unsplash image URL
    const [dailyContent, setDailyContent] = useState(null); // State to store daily ayat or hadith
    const [accessKey] = useState(config.accessKeyUnsplash);
    const [youtubeUrl] = useState(
        localStorage.getItem('youtubeUrl') || ''
    );
    const [currentTime, setCurrentTime] = useState(new Date());
    const isFriday = currentTime.getDay() === 5; // 5 = Jum'at
    const [timeToNextPrayer, setTimeToNextPrayer] = useState('');
    const [nameToNextPrayer, setNameToNextPrayer] = useState('');
    const [prayerTimes, setPrayerTimes] = useState({}); // State for prayer times
    const [currentDate, setCurrentDate] = useState({
        hijriyah: moment().format('iD/iM/iYYYY'), // Hijri date
        masehi: moment().format('DD-MM-YYYY'), // Gregorian date
    });
    const [photographer, setPhotographer] = useState(null); // State to store photographer
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
                }
                return prev === 'youtube' ? 'unsplash' : 'youtube';
            });
        }, 5 * 60 * 1000); // Switch background every 2 minutes

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

    const runningTexts = [
        "Masjid Al Muqorrobin menerima Infaq dan Shodaqoh Jama'ah melalui nomor rekening BSI: 7720004008 a.n. Masjid Al Muqorrobin",
        "Hai orang-orang beriman, apabila diseru untuk menunaikan shalat Jum'at, maka bersegeralah kamu kepada mengingat Allah dan tinggalkanlah jual beli. Yang demikian itu lebih baik bagimu jika kamu mengetahui.",
        "Dan di hari Jum'at pahala bersedekah dilipatgandakan (HR. Ibnu Khuzaimah)."
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
                    {currentBackground === 'youtube' && youtubeUrl ? (
                        <iframe
                            src={youtubeUrl}
                            title="Makkah Live Stream"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="main-youtube-iframe"
                        />
                    ) : null}
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