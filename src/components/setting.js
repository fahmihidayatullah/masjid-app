import React, { useState } from 'react';
import '../styles/setting.css'; // Import the CSS file
import config from './config'; // Import your configuration file

const iqomahKeys = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

const Setting = ({
  mosqueName,
  setMosqueName,
  runningText,
  setRunningText,
  setCurrentPage,
  iqomahTimes,
  setIqomahTimes,
  youtubeUrl,
  setYoutubeUrl
}) => {
    const [newMosqueName, setNewMosqueName] = useState(mosqueName);
    const [newRunningText, setNewRunningText] = useState(runningText); // Initialize running text state
    const [newIqomahTimes, setNewIqomahTimes] = useState({...iqomahTimes}); // Initialize running text state
    const [newYoutubeUrl, setNewYoutubeUrl] = useState(
        localStorage.getItem('youtubeUrl') || config.youtubeUrl || 'https://www.youtube.com/embed/{{code}}?autoplay=1&mute=1'
    );

    const handleIqomahChange = (key, value) => {
        setNewIqomahTimes(prev => ({
            ...prev,
            [key]: Number(value)
        }));
    };

    const handleSave = () => {
        setMosqueName(newMosqueName); // Update the mosque name in the parent component
        setRunningText(newRunningText); // Update the running text in the parent component
        setIqomahTimes(newIqomahTimes); // Update the iqomah times in the parent component
        setYoutubeUrl(newYoutubeUrl); // Update the YouTube URL in the parent component
        localStorage.setItem('mosqueName', newMosqueName); // Save the mosque name to local storage
        localStorage.setItem('runningText', newRunningText); // Save the running text to local storage
        localStorage.setItem('iqomahTimes', JSON.stringify(newIqomahTimes)); // Save the iqomah times to local storage
        localStorage.setItem('youtubeUrl', newYoutubeUrl); // Save the YouTube URL to local storage
        alert('Data has been updated!');
        setCurrentPage('main'); // Navigate back to the main display
    };

    const handleBackToWelcome = () => {
        setCurrentPage('welcome'); // Navigate back to the welcome page
    }

    return (
            <div className="setting-container">
                <h1 className="setting-title">Settings</h1>
                <table className="setting-table">
                    <tbody>
                        <tr>
                            <td className="setting-label">Mosque Name:</td>
                            <td>
                                <input
                                    type="text"
                                    value={newMosqueName}
                                    onChange={(e) => setNewMosqueName(e.target.value)}
                                    className="setting-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="setting-label">Running Text:</td>
                            <td>
                                <textarea
                                    value={newRunningText}
                                    onChange={(e) => setNewRunningText(e.target.value)}
                                    className="setting-textarea"
                                    rows="4"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="setting-label">Live Youtube URL:</td>
                            <td>
                            <input
                                type="text"
                                value={newYoutubeUrl}
                                onChange={(e) => setNewYoutubeUrl(e.target.value)}
                                className="setting-input"
                                placeholder={newYoutubeUrl || 'https://www.youtube.com/embed/{{code}}?autoplay=1&mute=1'}
                            />
                            </td>
                        </tr>
                        <tr>
                            <td className="setting-label" style={{ verticalAlign: 'top' }}>Iqomah Times :</td>
                            <td>
                                {iqomahKeys.map((key) => (
                                    <div key={key} style={{ marginBottom: 8 }}>
                                        <label style={{ marginRight: 8 }}>{key}:</label>
                                        <select
                                            value={newIqomahTimes[key] || 0}
                                            onChange={e => handleIqomahChange(key, e.target.value)}
                                            className="setting-input"
                                            style={{ width: 70 }}
                                        >
                                            <option value={60}>1</option>
                                            <option value={120}>2</option>
                                            <option value={180}>3</option>
                                            <option value={300}>5</option>
                                            <option value={600}>10</option>
                                            <option value={900}>15</option>
                                        </select> Menit
                                    </div>
                                ))}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="button-group">
                <button onClick={handleSave} className="setting-button">
                    Save
                </button>
                <button onClick={handleBackToWelcome} className="back-button">
                    Back to Home
                </button>
            </div>
            </div>
    );
};

export default Setting;