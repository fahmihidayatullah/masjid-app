import React, { useState, useEffect } from 'react';
import '../styles/Iqomah.css';

const IqomahCountdown = ({ prayerName, iqomahTime, onCountdownComplete }) => { // Accept onCountdownComplete as a prop
    const [timeLeft, setTimeLeft] = useState(iqomahTime); // 5 minutes in seconds
    const [audio, setAudio] = useState(null);

    useEffect(() => {
        // Initialize the audio object
        const audioInstance = new Audio('/assets/beep.mp3'); // Ensure the file is in the public/assets folder
        setAudio(audioInstance);
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) {
            playBeepSound();
            setTimeLeft(0); // Stop countdown at 0
            if (onCountdownComplete) {
                onCountdownComplete(); // Call the function passed as a prop
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timer); // Cleanup interval on component unmount
    }, [timeLeft, onCountdownComplete]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
            .toString()
            .padStart(2, '0')}`;
    };

    const playBeepSound = () => {
        if (audio) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    audio.currentTime = 0; // Reset audio to the beginning
                    audio.play().catch((err) => {
                        console.error('Audio playback failed:', err);
                    });
                }, i * 500); // Play beep every 500ms
            }
        }
    };

    return (
        <div className="iqomah-container">
            <h1 className="iqomah-title">Time to Iqomah</h1>
            <h2 className="iqomah-prayer-name">{prayerName}</h2>
            <h2 className="iqomah-countdown">{formatTime(timeLeft)}</h2>
        </div>
    );
};

export default IqomahCountdown;