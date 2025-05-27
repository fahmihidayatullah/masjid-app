import React, { useState } from 'react';
import '../styles/setting.css'; // Import the CSS file

const Setting = ({ mosqueName, setMosqueName, runningText, setRunningText, setCurrentPage }) => {
    const [newMosqueName, setNewMosqueName] = useState(mosqueName);
    const [newRunningText, setNewRunningText] = useState(runningText); // Initialize running text state

    const handleSave = () => {
        setMosqueName(newMosqueName); // Update the mosque name in the parent component
        setRunningText(newRunningText); // Update the running text in the parent component
        localStorage.setItem('mosqueName', newMosqueName); // Save the mosque name to local storage
        localStorage.setItem('runningText', newRunningText); // Save the running text to local storage
        alert('Data has been updated!');
        setCurrentPage('tv'); // Navigate back to the TV display
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