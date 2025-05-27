import React, { useState, useEffect } from 'react';
import '../styles/Main.css';
import config from './config';
import moment from 'moment-hijri';

const Main = ({ mosqueName, onPrayerTime, runningText, setCurrentPage }) => {
    const [currentBackground, setCurrentBackground] = useState('youtube');
    const [unsplashImage, setUnsplashImage] = useState(''); // State to store Unsplash image URL
    const [dailyContent, setDailyContent] = useState(null); // State to store daily ayat or hadith
    const [accessKey] = useState(config.accessKey);
    const [youtubeUrl] = useState(config.youtubeUrl);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeToNextPrayer, setTimeToNextPrayer] = useState('');
    const [nameToNextPrayer, setNameToNextPrayer] = useState('');
    const [prayerTimes, setPrayerTimes] = useState({}); // State for prayer times
    const [currentDate, setCurrentDate] = useState({
        hijriyah: moment().format('iD/iM/iYYYY'), // Hijri date
        masehi: moment().format('DD-MM-YYYY'), // Gregorian date
    });
    const [photographer, setPhotographer] = useState(null); // State to store photographer info

    useEffect(() => {
        // Update the date every second
        const updateDate = () => {
            const masehiDate = moment().format('dddd, DD MMMM YYYY'); // Format Masehi date
            const hijriyahDate = moment().format('iD iMMMM iYYYY'); // Format Hijriyah date
            setCurrentDate({ masehi: masehiDate, hijriyah: hijriyahDate });
        };

        updateDate(); // Initial update
        const timer = setInterval(updateDate, 1000); // Update every second

        return () => clearInterval(timer); // Cleanup interval on component unmount
    }, []);

    const fetchPrayerTimes = async (date) => {
        try {
            const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/1301/${date}`);
            const data = await response.json();

            if (data && data.data && data.data.jadwal) {
                const jadwal = data.data.jadwal;
                setPrayerTimes({
                    Subuh: jadwal.subuh,
                    Terbit: jadwal.terbit,
                    Dhuha: jadwal.dhuha,
                    Dzuhur: jadwal.dzuhur,
                    Ashar: jadwal.ashar,
                    Maghrib: jadwal.maghrib,
                    Isya: jadwal.isya,
                });
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
                    fetchUnsplashImage(); // Fetch a new image when switching to Unsplash
                }
                return prev === 'youtube' ? 'unsplash' : 'youtube';
            });
        }, 1 * 20 * 1000); // 5 minutes in milliseconds

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

    // Iqomah times in seconds (0 means no Iqomah for that prayer)
    const iqomahTimes = {
        Subuh: 600, // 10 minutes
        Terbit: 0,  // No Iqomah
        Dhuha: 0,   // No Iqomah
        Dzuhur: 600, // 10 minutes
        Ashar: 600, // 10 minutes
        Maghrib: 300, // 5 minutes
        Isya: 300, // 5 minutes
    };

    const contentList = [
        { type: "ayat", text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Sesungguhnya bersama kesulitan ada kemudahan. (QS. Al-Insyirah: 6)" },
        { type: "ayat", text: "وَأَقِمِ ٱلصَّلَوٰةَ إِنَّ ٱلصَّلَوٰةَ تَنْهَىٰ عَنِ ٱلْفَحْشَآءِ وَٱلْمُنكَرِ", translation: "Dirikanlah sholat, karena sholat mencegah dari perbuatan keji dan mungkar. (QS. Al-‘Ankabut: 45)" },
        { type: "ayat", text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", translation: "Tunjukilah kami jalan yang lurus. (QS. Al-Fatihah: 6)" },
        { type: "ayat", text: "فَاذْكُرُونِي أَذْكُرْكُمْ", translation: "Ingatlah kepada-Ku, niscaya Aku ingat (pula) kepadamu. (QS. Al-Baqarah: 152)" },
        { type: "ayat", text: "يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ", translation: "Wahai orang-orang yang beriman! Mohonlah pertolongan dengan sabar dan shalat. (QS. Al-Baqarah: 153)"},
        { type: "hadist", text: "الدِّينُ النَّصِيحَةُ", translation: "Agama adalah nasihat. (HR. Muslim)" },
        { type: "hadist", text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", translation: "Sesungguhnya setiap amal tergantung pada niatnya. (HR. Bukhari & Muslim)" },
        { type: "hadist", text: "مَنْ لاَ يَرْحَمْ لاَ يُرْحَمْ", translation: "Barangsiapa tidak menyayangi, maka tidak akan disayangi. (HR. Bukhari)" },
        { type: "hadist", text: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ", translation: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya. (HR. Ahmad)" },
        { type: "hadist", text: "سَبْعَةٌ يُظِلُّهُمُ اللَّهُ فِي ظِلِّهِ...", translation: "Ada tujuh golongan yang Allah naungi di hari tiada naungan selain naungan-Nya... (HR. Bukhari & Muslim)" }
    ];

    useEffect(() => {
        // Select daily content based on the day of the year
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const selectedContent = contentList[dayOfYear % contentList.length]; // Rotate through contentList
        setDailyContent(selectedContent);
    }, []);

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

        if (prayerName && iqomahTimes[prayerName] > 0) {
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
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

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
            const tomorrow = new Date(currentTime);
            tomorrow.setDate(currentTime.getDate() + 1);
            const year = tomorrow.getFullYear();
            const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // Add leading zero
            const day = String(tomorrow.getDate()).padStart(2, '0'); // Add leading zero
            const tomorrowDate = `${year}-${month}-${day}`;
            fetchPrayerTimes(tomorrowDate);
            times.splice(0, 0, ['now', now]);
        }

        return times;
    };

    const shiftedPrayerTimes = getShiftedPrayerTimes();

    return (
        <div className="main-container">
            {/* Left Section: YouTube or Unsplash */}
            <div className="main-left">
                {youtubeUrl ? (
                    <iframe
                        src={youtubeUrl}
                        title="YouTube Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="youtube-iframe"
                    ></iframe>
                ) : (
                    <div className="unsplash-container">
                        <img
                            src={unsplashImage}
                            alt="Unsplash Background"
                            className="unsplash-image"
                        />
                        {dailyContent && (
                            <div className="daily-content">
                                <p className="daily-text">{dailyContent.text}</p>
                                <p className="daily-translation">{dailyContent.translation}</p>
                                {photographer && (
                                    <p className="unsplash-attribution">
                                        Photo by <a href={photographer.link} target="_blank" rel="noopener noreferrer">{photographer.name}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Section: Mosque Info */}
            <div className="main-right">
                <div className="mosque-info">
                    <h1 className="mosque-name">{mosqueName}</h1>
                    <p className="current-date">{currentDate.masehi}</p>
                    <p className="current-date">{currentDate.hijriyah}</p>
                </div>
                <div className="prayer-times">
                    {/* <h2>Prayer Times</h2> */}
                    {Object.entries(prayerTimes).map(([prayer, time]) => (
                        <div key={prayer} className="prayer-time">
                            <span className="prayer-name">{prayer}</span>
                            <span className="prayer-time-value">{time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Prayer Times Section */}
            <div className="prayer-times-container">
                {shiftedPrayerTimes.map(([prayer, time], index) => (
                    <div
                        key={prayer}
                        className={`prayer-times-box ${
                            prayer === 'now' ? 'current-time-box' : ''
                        }`}
                    >
                        {prayer === 'now' ? (
                            <div>
                                <div>Now: {time}</div>
                                <div>Next {nameToNextPrayer}: {timeToNextPrayer}</div>
                            </div>
                        ) : (
                            <div>
                                <div>{prayer}</div>
                                <div>{time}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="tv-container">
            {/* Mosque Name */}
            <div className="mosque-name">
                {mosqueName}
                <button
                    className="close-button"
                    onClick={() => setCurrentPage('welcome')}
                >
                    X
                </button>
            </div>


            {/* Running text */}
            <div className="running-text-container">
                <div className="running-text">{runningText}</div>
            </div>
        </div>
    );
};

export default Main;