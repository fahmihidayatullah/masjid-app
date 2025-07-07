import React, { useState, useEffect } from 'react';
import TvDisplay from './TvDisplay';
import Main from './Main';
import IqomahCountdown from './Iqomah';
import Setting from './setting';
import '../styles/app.css'; // Import your CSS file for styling
import logo from '../assets/logo.png'; // Import your logo image
import config from './config'; // Import your configuration file

const App = () => {
    const [currentPage, setCurrentPage] = useState('welcome'); // 'countdown', 'shaf', 'blank', 'tv'
    const [currentIqomahTime, setCurrentIqomahTime] = useState(0);
    const [currentPrayerName, setCurrentPrayerName] = useState('');
    
    const [mosqueName, setMosqueName] = useState(() => {
      return localStorage.getItem('mosqueName') || config.mosqueName;
    });
    const [runningText, setRunningText] = useState(() => {
      return localStorage.getItem('runningText') || config.runningText;
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

    useEffect(() => {
        let timer;
        // Deteksi Sholat Jumat
        const isFriday = new Date().getDay() === 5;
        const isJumatPrayer = isFriday && (currentPrayerName === 'Dzuhur' || currentPrayerName === "Jum'at");
        if (currentPage === 'shaf' ) {
            if (isJumatPrayer) {
                timer = setTimeout(() => {
                setCurrentPage('blank');
            }, 30 * 60 * 1000); // Show "Diam waktu Khutbah!" page for 20 minutes
            } else {
                timer = setTimeout(() => {
                setCurrentPage('blank');
            }, 10 * 1000); // Show "Rapatkan Shaf!" page for 10 second
            }
            
        } else if (currentPage === 'blank') {
            timer = setTimeout(() => {
                setCurrentPage('main');
            }, 10 * 60 * 1000); // 15 minutes for "blank" page
        }

        return () => clearTimeout(timer); // Cleanup timer on component unmount
    }, [currentPage]);

    // Define handlePrayerTime to transition to the Iqomah countdown page
    const handlePrayerTime = (prayerName, iqomahTime) => {
      setCurrentPrayerName(prayerName);
        setCurrentIqomahTime(iqomahTime);
      setCurrentPage('countdown'); // Transition to Iqomah countdown page
  };

    const handleCountdownComplete = () => {
        setCurrentPage('shaf'); // Transition to "Rapatkan Shaf!" page
    };

    if (currentPage === 'welcome') {
      return (
          <div className="welcome-container">
              <img src={logo} alt="Al-Muqorrobin Logo" className="welcome-logo" />
              <h1 className="welcome-text">Bismillah, saya akan memulai aplikasi Masjid App</h1>
              <div className="button-container">
                  <button className="welcome-button" onClick={() => setCurrentPage('tv')}>
                      OK {iqomahTimes[0]}
                  </button>
                  <button className="welcome-button" onClick={() => setCurrentPage('main')}>
                      Main
                  </button>
                  <button className="welcome-button" onClick={() => setCurrentPage('setting')}>
                      Setting
                  </button>
              </div>
          </div>
      );
  }

    if (currentPage === 'countdown') {
      return (
        <IqomahCountdown
            prayerName={currentPrayerName}
            iqomahTime={currentIqomahTime}
            onCountdownComplete={handleCountdownComplete}
        />
      );
    }

    if (currentPage === 'shaf') {
        // Deteksi Sholat Jumat
    const isFriday = new Date().getDay() === 5;
    const isJumatPrayer = isFriday && (currentPrayerName === 'Dzuhur' || currentPrayerName === "Jum'at");
        return (
        <div className="shaf-container" style={{ background: 'black', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h1 className="shaf-text" style={{ color: 'white', fontSize: '7rem', textAlign: 'center' }}>
                {isJumatPrayer ? 'Diam saat khutbah!' : 'Rapatkan Shaf!'}
            </h1>
        </div>
        );
    }

    if (currentPage === 'blank') {
        return <div style={{ backgroundColor: 'black', height: '100vh' }}></div>;
    }

    if (currentPage === 'tv') {
      return <TvDisplay 
        mosqueName={mosqueName} // Pass the mosque name to TvDisplay
        onPrayerTime={handlePrayerTime}
        runningText={runningText}
        setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === 'main') {
      return <Main 
        mosqueName={mosqueName} // Pass the mosque name to Main
        onPrayerTime={handlePrayerTime}
        runningText={runningText}
        setCurrentPage={setCurrentPage} 
        iqomahTimes={iqomahTimes}
        />;
    }

    if (currentPage === 'setting') {
        return (
            <Setting
                mosqueName={mosqueName}
                setMosqueName={setMosqueName} // Pass the setter function to the Setting component
                runningText={runningText}
                setRunningText={setRunningText} // Pass the setter function to the Setting component
                setCurrentPage={setCurrentPage} // Pass the setter function to navigate back to TV display
                iqomahTimes={iqomahTimes}
                setIqomahTimes={setIqomahTimes}
                youtubeUrl={youtubeUrl}
                setYoutubeUrl={setYoutubeUrl} // Pass the setter function to the Setting component
            />
        );
    }

    return <TvDisplay onPrayerTime={handlePrayerTime} />;
};

export default App;