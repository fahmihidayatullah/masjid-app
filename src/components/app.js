import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import TvDisplay from './TvDisplay';
import Main from './Main';
import IqomahCountdown from './Iqomah';
import Setting from './setting';
import '../styles/app.css'; // Import your CSS file for styling
import logo from '../assets/logo.png'; // Import your logo image
import config from './config'; // Import your configuration file

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState('welcome'); // 'countdown', 'shaf', 'blank', 'tv'
    const [currentIqomahTime, setCurrentIqomahTime] = useState(0);
    const [currentPrayerName, setCurrentPrayerName] = useState('');
    
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
        else if (page === 'welcome') navigate('/');
        // Internal states like countdown, shaf, blank don't change URL but stay on current route
    };

    // Check URL on component mount to set initial page
    useEffect(() => {
        const path = location.pathname;
        if (path === '/main') setCurrentPage('main');
        else if (path === '/setting') setCurrentPage('setting');
        else if (path === '/tv') setCurrentPage('tv');
        else setCurrentPage('welcome');
    }, [location.pathname]);

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
        setCurrentIqomahTime(iqomahTime);
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
                        <div className="button-container">
                            <button className="welcome-button" onClick={() => navigateToPage('main')}>
                                Main
                            </button>
                            <button className="welcome-button" onClick={() => navigateToPage('setting')}>
                                Setting
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
            </Routes>
        </div>
    );
};

export default App;