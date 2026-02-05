import React, { useState, useEffect, useRef } from 'react';
import '../styles/Main.css';
import '../styles/Iqomah.css';
import moment from 'moment-hijri';
import 'moment/locale/id';

const IqomahCountdown = ({ prayerName, iqomahTime, onCountdownComplete }) => { // Accept onCountdownComplete as a prop
    const [audio, setAudio] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [endTime] = useState(() => {
        const now = new Date();
        return new Date(now.getTime() + iqomahTime * 1000);
    });
    const [mosqueName] = useState(() => {
        return localStorage.getItem('mosqueName') || 'Masjid Al-Muqorrobin';
    });
    const [currentDate, setCurrentDate] = useState({
        hijriyah: moment().format('iD/iM/iYYYY'),
        masehi: moment().format('DD-MM-YYYY'),
    });

    const hijriMonthsLatin = [
        "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir",
        "Jumadil Awal", "Jumadil Akhir", "Rajab", "Syaban",
        "Ramadhan", "Syawwal", "Dzulqaidah", "Dzulhijjah"
    ];

    function getHijriLatin() {
        const iDate = moment();
        const day = iDate.iDate();
        const month = hijriMonthsLatin[iDate.iMonth()];
        const year = iDate.iYear();
        return `${day} ${month} ${year}`;
    }

    // Deteksi Sholat Jumat
    const isFriday = new Date().getDay() === 5;
    const isJumatPrayer = isFriday && (prayerName === 'Dzuhur' || prayerName === "Jum'at");

    // Calculate time left based on current time and end time
    const timeLeft = Math.max(0, Math.floor((endTime - currentTime) / 1000));

    // Update current time and date every second
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            
            // Update date
            moment.locale('id');
            const masehiDate = moment().format('dddd, DD MMMM YYYY');
            const hijriyahDate = getHijriLatin();
            setCurrentDate({ masehi: masehiDate, hijriyah: hijriyahDate });
        }, 1000);
        return () => clearInterval(timer);
    }, []);


    useEffect(() => {
            const audioInstance = new Audio('/assets/beep.mp3');
            setAudio(audioInstance);

            // Tunggu sedikit agar audio ready, lalu mainkan 5x
            setTimeout(() => {
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        audioInstance.currentTime = 0;
                        audioInstance.play().catch((err) => {
                            console.error('Audio playback failed:', err);
                        });
                    }, i * 1200); // play beep every 1.2 seconds
                }
            }, 500);
    }, [isJumatPrayer]);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (!isJumatPrayer) { // Play beep sound only if it's not Friday's prayer
                playBeepSound();
            }
            if (onCountdownComplete) {
                onCountdownComplete(); // Call the function passed as a prop
            }
        }
    }, [timeLeft, onCountdownComplete, isJumatPrayer]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
            .toString()
            .padStart(2, '0')}`;
    };

    const playBeepSound = (n = 3) => {
    if (audio) {
        for (let i = 0; i < n; i++) {
            setTimeout(() => {
                audio.currentTime = 0; // Reset audio to the beginning
                audio.play().catch((err) => {
                    console.error('Audio playback failed:', err);
                });
            }, i * 1200); // play beep every 1s 200ms
        }
    }
};

    // Running text logic (carousel, animated, cycling)
    let runningTextArray = [];
    try {
        const saved = localStorage.getItem('runningTextArray');
        if (saved) {
            runningTextArray = JSON.parse(saved);
        }
    } catch {
        runningTextArray = [];
    }
    if (!Array.isArray(runningTextArray) || runningTextArray.length === 0) {
        runningTextArray = [
            'Jaga kebersihan dan ketertiban masjid',
            'Silakan matikan HP saat sholat',
        ];
    }

    const [runningTextIndex, setRunningTextIndex] = useState(0);
    const [animateKey, setAnimateKey] = useState(0);
    const carouselRef = useRef(null);

    // Durasi animasi tergantung panjang teks
    useEffect(() => {
        const text = runningTextArray[runningTextIndex] || '';
        const duration = Math.min(Math.max(text.length * 200, 10000), 30000);
        if (carouselRef.current) {
            carouselRef.current.style.setProperty('--running-text-duration', `${duration}ms`);
        }
        const timer = setTimeout(() => {
            setRunningTextIndex(prev => (prev + 1) % runningTextArray.length);
            setAnimateKey(prev => prev + 1);
        }, duration);
        return () => clearTimeout(timer);
    }, [runningTextIndex, runningTextArray.length]);

    if (isJumatPrayer) {
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
                            {currentTime.getSeconds().toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
                <div className="iqomah-container" style={{ background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 80px)', flexDirection: 'column', position: 'relative' }}>
                    <h1 style={{ fontSize: '6rem', width: '100%', textAlign: 'center' }}>Waktu Sholat Jum'at</h1>
                    <div className="main-running-text-container" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
                        <div className="main-running-carousel-text animate-carousel" ref={carouselRef}>
                            <span key={animateKey}>{runningTextArray[runningTextIndex]}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
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
                        {currentTime.getSeconds().toString().padStart(2, '0')}
                    </span>
                </div>
            </div>
            <div className="iqomah-container" style={{ 
                position: 'relative', 
                minHeight: 'calc(100vh - 80px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: '15vh'
            }}>
                <h1 className="iqomah-title">Time to Iqomah</h1>
                <h2 className="iqomah-prayer-name">{prayerName}</h2>
                <h2 className="iqomah-countdown">{formatTime(timeLeft)}</h2>
                <div className="main-running-text-container" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
                    <div className="main-running-carousel-text animate-carousel" ref={carouselRef}>
                        <span key={animateKey}>{runningTextArray[runningTextIndex]}</span>
                    </div>
                </div>
            </div>
        </div>
    );
    }
};

export default IqomahCountdown;