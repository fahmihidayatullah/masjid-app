import React, { useState, useEffect } from 'react';
import TvDisplay from './TvDisplay';
import IqomahCountdown from './Iqomah';
import Setting from './setting';
import '../styles/app.css'; // Import your CSS file for styling
import logo from '../assets/logo.png'; // Import your logo image

const App = () => {
    const [currentPage, setCurrentPage] = useState('welcome'); // 'countdown', 'shaf', 'blank', 'tv'
    const [currentIqomahTime, setCurrentIqomahTime] = useState(0);
    const [currentPrayerName, setCurrentPrayerName] = useState('');
    const [mosqueName, setMosqueName] = useState(() => {
      return localStorage.getItem('mosqueName') || 'Masjid';
    });
    const [runningText, setRunningText] = useState(() => {
      return localStorage.getItem('runningText') || 'Jadwal Sholat Masjid';
    });

    useEffect(() => {
        let timer;

        if (currentPage === 'shaf') {
            // Show "Rapatkan Shaf!" page for 10 seconds
            timer = setTimeout(() => {
                setCurrentPage('blank');
            }, 10000);
        } else if (currentPage === 'blank') {
            // Show blank page for 5 detik
            timer = setTimeout(() => {
                setCurrentPage('tv');
            }, 5 * 1000);
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
                      OK
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
        return (
          <div className="shaf-container">
              <h1 className="shaf-text">Rapatkan Shaf!</h1>
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

    if (currentPage === 'setting') {
        return (
            <Setting
                mosqueName={mosqueName}
                setMosqueName={setMosqueName} // Pass the setter function to the Setting component
                runningText={runningText}
                setRunningText={setRunningText} // Pass the setter function to the Setting component
                setCurrentPage={setCurrentPage} // Pass the setter function to navigate back to TV display
            />
        );
    }

    return <TvDisplay onPrayerTime={handlePrayerTime} />;
};

export default App;