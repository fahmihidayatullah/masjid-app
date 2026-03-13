import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import TvDisplay from './TvDisplay.jsx';
import Main from './Main.jsx';
import IqomahCountdown from './Iqomah.jsx';
import Setting from './setting.jsx';
import Deteksi from './Deteksi.jsx';
import CCTV from './cctv.jsx';
import Stream from './Stream.jsx';
import About from './About.jsx';
import backgroundDetectionService from '../services/BackgroundDetectionService';
import '../styles/app.css';
import logo from '../assets/logo.png';
import config from './config';

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState('welcome'); // 'countdown', 'shaf', 'blank', 'tv', 'deteksi', 'cctv'
    const [currentIqomahTime, setCurrentIqomahTime] = useState(0);
    const [currentPrayerName, setCurrentPrayerName] = useState('');
    const [backgroundServiceStatus, setBackgroundServiceStatus] = useState({ running: false });
    
    const [mosqueName, setMosqueName] = useState(() => {
      return localStorage.getItem('mosqueName') || config.mosqueName;
    });
    const [runningText, setRunningText] = useState(() => {
      const saved = localStorage.getItem('runningTextArray');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return config.runningText;
        }
      }
      return config.runningText;
    });
    const [youtubeUrl, setYoutubeUrl] = useState(
        localStorage.getItem('youtubeUrl') || config.youtubeUrl || ''
    );
    const [streamUrl, setStreamUrl] = useState(
        localStorage.getItem('streamUrl') || config.streamUrl || ''
    );
    const getIqomahTimes = () => {
        const saved = localStorage.getItem('iqomahTimes');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return config.iqomahTimes;
            }
        }
        return config.iqomahTimes;
    };

    const [iqomahTimes, setIqomahTimes] = useState(getIqomahTimes());

    // Enhanced setCurrentPage that also navigates URL  
    const navigateToPage = (page) => {
        setCurrentPage(page);
        if (page === 'main') navigate('/main');
        else if (page === 'setting') navigate('/setting');
        else if (page === 'tv') navigate('/tv');
        else if (page === 'deteksi') navigate('/deteksi');
        else if (page === 'cctv') navigate('/cctv');
        else if (page === 'stream') navigate('/stream');
        else if (page === 'about') navigate('/about');
        else if (page === 'welcome') navigate('/');
    };

    // Check URL on component mount to set initial page
    useEffect(() => {
        const path = location.pathname;
        if (path === '/main') setCurrentPage('main');
        else if (path === '/setting') setCurrentPage('setting');
        else if (path === '/tv') setCurrentPage('tv');
        else if (path === '/deteksi') setCurrentPage('deteksi');
        else if (path === '/cctv') setCurrentPage('cctv'); // Tambahkan deteksi path CCTV
        else if (path === '/stream') setCurrentPage('stream'); 
        else setCurrentPage('welcome');
    }, [location.pathname]);

    // Initialize Background Detection Service
    useEffect(() => {
        // Start the service
        backgroundDetectionService.start();
        
        // Subscribe to status updates
        const unsubscribe = backgroundDetectionService.onStatusChange((status) => {
            setBackgroundServiceStatus(status);
        });
        
        // Cleanup on unmount
        return () => {
            backgroundDetectionService.stop();
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        let timer;
        
        // Deteksi Sholat Jumat
        const isFriday = new Date().getDay() === 5;
        const isJumatPrayer = isFriday && (currentPrayerName === 'Dzuhur' || currentPrayerName === "Jum'at");
        
        if (currentPage === 'shaf' ) {
            if (isJumatPrayer) {
                timer = setTimeout(() => {
                    setCurrentPage('blank');
                }, 30 * 60 * 1000); // Show "Diam waktu Khutbah!" page for 30 minutes
            } else {
                timer = setTimeout(() => {
                    setCurrentPage('blank');
                }, 20 * 1000); // Show "Rapatkan Shaf!" page for 20 second
            }
            
        } else if (currentPage === 'blank') {
            timer = setTimeout(() => {
                navigateToPage('main'); // Use navigateToPage for URL navigation
            }, 10 * 60 * 1000); // 10 minutes for blank page
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        }; // Cleanup timer on component unmount
    }, [currentPage, currentPrayerName]);

    // Define handlePrayerTime to transition to the Iqomah countdown page
    const handlePrayerTime = (prayerName, iqomahTime) => {
        setCurrentPrayerName(prayerName);
        // Jika hari Jumat dan sholat Dzuhur/Jum'at, waktu iqomah 3 menit (180 detik)
        const isFriday = new Date().getDay() === 5;
        const isJumatPrayer = isFriday && (prayerName === 'Dzuhur' || prayerName === "Jum'at");
        if (isJumatPrayer) {
            setCurrentIqomahTime(180); // 3 menit
        } else {
            setCurrentIqomahTime(iqomahTime);
        }
        setCurrentPage('countdown'); // This will trigger re-render with countdown overlay
    };

    const handleCountdownComplete = () => {
        setCurrentPage('shaf'); // Transition to "Rapatkan Shaf!" page
    };

    return (
        <div>
            {/* Overlay untuk state internal seperti countdown, shaf, blank */}
            {currentPage === 'countdown' && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
                    <IqomahCountdown
                        prayerName={currentPrayerName}
                        iqomahTime={currentIqomahTime}
                        onCountdownComplete={handleCountdownComplete}
                    />
                </div>
            )}
            
            {currentPage === 'shaf' && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
                    <div className="shaf-container" style={{ background: 'black', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h1 className="shaf-text" style={{ color: 'white', fontSize: '7rem', textAlign: 'center' }}>
                            {(() => {
                                const isFriday = new Date().getDay() === 5;
                                const isJumatPrayer = isFriday && (currentPrayerName === 'Dzuhur' || currentPrayerName === "Jum'at");
                                return isJumatPrayer ? 'Diam saat khutbah!' : 'Rapatkan Shaf!';
                            })()}
                        </h1>
                    </div>
                </div>
            )}
            
            {currentPage === 'blank' && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, backgroundColor: 'black' }}></div>
            )}

            {/* Routes untuk navigasi normal */}
            <Routes>
                <Route path="/" element={
                    <div className="welcome-container">
                        <img src={logo} alt="Al-Muqorrobin Logo" className="welcome-logo" />
                        <h1 className="welcome-text">Bismillah, saya akan memulai aplikasi Masjid App</h1>
                        
                        {/* Background Service Status */}
                        <div style={{
                            background: backgroundServiceStatus.running ? '#27ae60' : '#95a5a6',
                            color: 'white',
                            padding: '1rem 2rem',
                            borderRadius: '8px',
                            margin: '1rem 0',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            justifyContent: 'center'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>
                                {backgroundServiceStatus.running ? '🟢' : '⚫'}
                            </span>
                            <span>
                                {backgroundServiceStatus.running 
                                    ? `Auto Deteksi Aktif: ${backgroundServiceStatus.prayer}` 
                                    : 'Auto Deteksi Standby'}
                            </span>
                        </div>
                        
                        <div className="button-container">
                            <button className="welcome-button" style={{ minWidth: 140, height: 48, fontSize: '1.1rem' }} onClick={() => navigateToPage('main')}>
                                Main
                            </button>
                            <button className="welcome-button" style={{ minWidth: 140, height: 48, fontSize: '1.1rem' }} onClick={() => navigateToPage('setting')}>
                                Setting
                            </button>
                            <button className="welcome-button" style={{ minWidth: 140, height: 48, fontSize: '1.1rem' }} onClick={() => navigateToPage('stream')}>
                                Live Stream
                            </button>
                            <button className="welcome-button" style={{ minWidth: 140, height: 48, fontSize: '1.1rem' }} onClick={() => navigateToPage('about')}>
                                About
                            </button>
                        </div>
                    </div>
                } />
                
                <Route path="/main" element={
                    <Main 
                        mosqueName={mosqueName}
                        onPrayerTime={handlePrayerTime}
                        runningText={runningText}
                        setCurrentPage={navigateToPage} 
                        iqomahTimes={iqomahTimes}
                    />
                } />
                
                <Route path="/setting" element={
                    <Setting
                        mosqueName={mosqueName}
                        setMosqueName={setMosqueName}
                        runningText={runningText}
                        setRunningText={setRunningText}
                        setCurrentPage={navigateToPage}
                        iqomahTimes={iqomahTimes}
                        setIqomahTimes={setIqomahTimes}
                        youtubeUrl={youtubeUrl}
                        setYoutubeUrl={setYoutubeUrl}
                        streamUrl={streamUrl}
                        setStreamUrl={setStreamUrl}
                    />
                } />
                
                <Route path="/tv" element={
                    <TvDisplay 
                        mosqueName={mosqueName}
                        onPrayerTime={handlePrayerTime}
                        runningText={runningText}
                        setCurrentPage={navigateToPage}
                    />
                } />

                <Route path="/deteksi" element={
                    <Deteksi
                        mosqueName={mosqueName}
                        setCurrentPage={navigateToPage}
                    />
                } />

                <Route path="/cctv" element={
                    <CCTV
                        mosqueName={mosqueName}
                        setCurrentPage={navigateToPage}
                    />
                } />

                <Route path="/stream" element={
                    <Stream setCurrentPage={navigateToPage} />
                } />
                <Route path="/about" element={<About setCurrentPage={navigateToPage} />} />
            </Routes>
        </div>
    );
};

export default App;