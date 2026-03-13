import React, { useRef, useEffect } from 'react';
import config from './config';
import '../styles/Main.css'; // reuse main style for fullscreen

const Stream = ({ setCurrentPage, streamUrl }) => {
  const StreamUrl =  streamUrl || localStorage.getItem('streamUrl') || config.streamUrl || '';
  const iframeRef = useRef(null);

  useEffect(() => {
    // Request fullscreen on mount
    const iframe = iframeRef.current;
    if (iframe && iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe && iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen();
    } else if (iframe && iframe.mozRequestFullScreen) {
      iframe.mozRequestFullScreen();
    } else if (iframe && iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen();
    }
  }, []);

  return (
    <div
      className="stream-fullscreen-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Tombol X pojok kanan atas selalu tampil */}
      <button
        className="stream-close-btn"
        style={{
          position: 'absolute',
          top: 24,
          right: 32,
          fontSize: '2.5rem',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          cursor: 'pointer',
          zIndex: 10001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'background 0.2s',
        }}
        title="Keluar ke Home"
        onClick={() => setCurrentPage && setCurrentPage('welcome')}
      >
        ×
      </button>
      {/* YouTube iframe */}
      <iframe
        ref={iframeRef}
        src={StreamUrl}
        title="Live YouTube Stream"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          background: '#000',
        }}
      />
    </div>
  );
};

export default Stream;
