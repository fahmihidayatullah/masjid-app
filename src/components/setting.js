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
    const [newRunningText, setNewRunningText] = useState(
        Array.isArray(runningText) ? runningText : [runningText || ""]
    ); // Initialize running text array state
    const [newIqomahTimes, setNewIqomahTimes] = useState({...iqomahTimes}); // Initialize running text state
    const [newYoutubeUrl, setNewYoutubeUrl] = useState(
        localStorage.getItem('youtubeUrl') || config.youtubeUrl || 'https://www.youtube.com/embed/{{code}}?autoplay=1&mute=1'
    );
    const [khatibData, setKhatibData] = useState(() => {
        const saved = localStorage.getItem('khatibData');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return { nama: '', tema: '', tanggal: '', foto: '', positionX: 50, positionY: 50 };
            }
        }
        return { nama: '', tema: '', tanggal: '', foto: '', positionX: 50, positionY: 50 };
    });

    const handleIqomahChange = (key, value) => {
        setNewIqomahTimes(prev => ({
            ...prev,
            [key]: Number(value)
        }));
    };

    const handleRunningTextChange = (index, value) => {
        setNewRunningText(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const addRunningText = () => {
        setNewRunningText(prev => [...prev, ""]);
    };

    const removeRunningText = (index) => {
        if (newRunningText.length > 1) {
            setNewRunningText(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Fungsi untuk mengkonversi URL Google Drive menjadi direct link
    const convertGoogleDriveUrl = (url) => {
        if (!url) return url;
        
        // Pattern untuk URL Google Drive: https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
        const drivePattern = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(drivePattern);
        
        if (match) {
            const fileId = match[1];
            // Gunakan format thumbnail dengan ukuran besar untuk gambar yang lebih reliable
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
        
        // Jika sudah dalam format direct link, return as is
        if (url.includes('drive.google.com/uc?') || url.includes('drive.google.com/thumbnail?')) {
            return url;
        }
        
        return url; // Return original URL jika bukan Google Drive
    };

    const handleKhatibChange = (field, value) => {
        let processedValue = value;
        
        // Jika field adalah foto, konversi URL Google Drive
        if (field === 'foto') {
            processedValue = convertGoogleDriveUrl(value);
        }
        
        setKhatibData(prev => ({
            ...prev,
            [field]: processedValue
        }));
    };

    // Fungsi untuk memeriksa apakah tanggal adalah hari Jum'at
    const isDateFriday = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            return date.getDay() === 5; // 5 = Friday
        } catch {
            return null;
        }
    };

    const handleSave = () => {
        setMosqueName(newMosqueName); // Update the mosque name in the parent component
        setRunningText(newRunningText.filter(text => text.trim() !== "")); // Update the running text array in the parent component, filter empty texts
        setIqomahTimes(newIqomahTimes); // Update the iqomah times in the parent component
        setYoutubeUrl(newYoutubeUrl); // Update the YouTube URL in the parent component
        localStorage.setItem('mosqueName', newMosqueName); // Save the mosque name to local storage
        localStorage.setItem('runningTextArray', JSON.stringify(newRunningText.filter(text => text.trim() !== ""))); // Save the running text array to local storage
        localStorage.setItem('iqomahTimes', JSON.stringify(newIqomahTimes)); // Save the iqomah times to local storage
        localStorage.setItem('youtubeUrl', newYoutubeUrl); // Save the YouTube URL to local storage
        localStorage.setItem('khatibData', JSON.stringify(khatibData)); // Save the khatib data to local storage
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
                            <td className="setting-label" style={{ verticalAlign: 'top' }}>Running Texts:</td>
                            <td>
                                {newRunningText.map((text, index) => (
                                    <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                        <textarea
                                            value={text}
                                            onChange={(e) => handleRunningTextChange(index, e.target.value)}
                                            className="setting-textarea"
                                            rows="2"
                                            placeholder={`Running text ${index + 1}`}
                                            style={{ flex: 1, marginRight: '10px' }}
                                        />
                                        {newRunningText.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRunningText(index)}
                                                className="remove-button"
                                                style={{ 
                                                    background: '#ff4444', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    padding: '5px 10px', 
                                                    borderRadius: '3px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addRunningText}
                                    className="add-button"
                                    style={{ 
                                        background: '#4CAF50', 
                                        color: 'white', 
                                        border: 'none', 
                                        padding: '8px 15px', 
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        marginTop: '5px'
                                    }}
                                >
                                    + Tambah Running Text
                                </button>
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
                            <td className="setting-label" style={{ verticalAlign: 'top' }}>Khatib Jum'at:</td>
                            <td>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Nama Khatib:</label>
                                    <input
                                        type="text"
                                        value={khatibData.nama}
                                        onChange={(e) => handleKhatibChange('nama', e.target.value)}
                                        className="setting-input"
                                        placeholder="Masukkan nama khatib"
                                        style={{ width: '100%', marginBottom: 8 }}
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Tema Khotbah:</label>
                                    <textarea
                                        value={khatibData.tema}
                                        onChange={(e) => handleKhatibChange('tema', e.target.value)}
                                        className="setting-input"
                                        placeholder="Masukkan tema khotbah"
                                        style={{ width: '100%', height: '80px', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Tanggal Khatib:</label>
                                    <input
                                        type="date"
                                        value={khatibData.tanggal || ''}
                                        onChange={(e) => handleKhatibChange('tanggal', e.target.value)}
                                        className="setting-input"
                                        style={{ width: '100%', marginBottom: 8 }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                                        Pilih tanggal untuk khatib Jum'at. Sistem akan otomatis memeriksa apakah tanggal yang dipilih adalah hari Jum'at.
                                    </div>
                                    {khatibData.tanggal && (
                                        <div style={{
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor: isDateFriday(khatibData.tanggal) === true ? '#d4edda' : 
                                                           isDateFriday(khatibData.tanggal) === false ? '#f8d7da' : '#fff3cd',
                                            border: `1px solid ${isDateFriday(khatibData.tanggal) === true ? '#c3e6cb' : 
                                                    isDateFriday(khatibData.tanggal) === false ? '#f5c6cb' : '#ffeaa7'}`,
                                            color: isDateFriday(khatibData.tanggal) === true ? '#155724' : 
                                                  isDateFriday(khatibData.tanggal) === false ? '#721c24' : '#856404'
                                        }}>
                                            {isDateFriday(khatibData.tanggal) === true ? 
                                                '✅ Tanggal yang dipilih adalah hari Jum\'at' :
                                                isDateFriday(khatibData.tanggal) === false ?
                                                '⚠️ Peringatan: Tanggal yang dipilih bukan hari Jum\'at' :
                                                '❓ Format tanggal tidak valid'
                                            }
                                            {isDateFriday(khatibData.tanggal) === true && (
                                                <div style={{ marginTop: 4, fontWeight: 'bold' }}>
                                                    Tanggal: {new Date(khatibData.tanggal).toLocaleDateString('id-ID', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>URL Foto Khatib:</label>
                                    <input
                                        type="url"
                                        value={khatibData.foto}
                                        onChange={(e) => handleKhatibChange('foto', e.target.value)}
                                        className="setting-input"
                                        placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
                                        style={{ width: '100%' }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                        <strong>Untuk Google Drive:</strong>
                                        <br />1. Klik kanan file → "Get link" → "Anyone with the link"
                                        <br />2. Copy link yang dimulai dengan: https://drive.google.com/file/d/...
                                        <br />3. URL akan otomatis dikonversi untuk menampilkan gambar
                                        {khatibData.foto && khatibData.foto.includes('drive.google.com') && (
                                            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#e8f4f8', borderRadius: 4 }}>
                                                <strong>URL yang akan digunakan:</strong><br />
                                                <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>{khatibData.foto}</code>
                                            </div>
                                        )}
                                    </div>
                                    {khatibData.foto && (
                                        <div style={{ marginTop: 8 }}>
                                            <img 
                                                src={khatibData.foto} 
                                                alt="Preview foto khatib"
                                                style={{ 
                                                    width: '100px', 
                                                    height: '100px', 
                                                    objectFit: 'cover', 
                                                    objectPosition: `${khatibData.positionX || 50}% ${khatibData.positionY || 50}%`,
                                                    borderRadius: '50%',
                                                    border: '2px solid #ddd'
                                                }}
                                                onError={(e) => {
                                                    // Coba format alternatif untuk Google Drive
                                                    if (khatibData.foto.includes('drive.google.com')) {
                                                        const drivePattern = /\/id\/([a-zA-Z0-9_-]+)/;
                                                        const match = khatibData.foto.match(drivePattern) || 
                                                                     khatibData.foto.match(/file\/d\/([a-zA-Z0-9_-]+)/);
                                                        
                                                        if (match) {
                                                            const fileId = match[1];
                                                            const altFormats = [
                                                                `https://drive.google.com/uc?id=${fileId}`,
                                                                `https://drive.google.com/uc?export=view&id=${fileId}`,
                                                                `https://lh3.googleusercontent.com/d/${fileId}=w1000`
                                                            ];
                                                            
                                                            // Coba format pertama yang belum dicoba
                                                            for (const altUrl of altFormats) {
                                                                if (altUrl !== khatibData.foto) {
                                                                    e.target.src = altUrl;
                                                                    return;
                                                                }
                                                            }
                                                        }
                                                    }
                                                    
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                                onLoad={(e) => {
                                                    e.target.style.display = 'block';
                                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'none';
                                                }}
                                            />
                                            <div style={{ 
                                                display: 'none', 
                                                marginTop: 8, 
                                                padding: '8px', 
                                                backgroundColor: '#fff3cd', 
                                                border: '1px solid #ffeaa7', 
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#856404'
                                            }}>
                                                ⚠️ Gambar gagal dimuat. Pastikan:
                                                <br />• URL Google Drive sudah benar
                                                <br />• File dapat diakses publik ("Anyone with the link")
                                                <br />• Format file adalah JPG/PNG
                                                <br />• Ukuran file tidak terlalu besar (&lt;10MB)
                                            </div>
                                            
                                            {/* Kontrol Posisi Gambar */}
                                            <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: '12px' }}>
                                                    Atur Posisi Gambar:
                                                </label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                    <div>
                                                        <label style={{ fontSize: '11px', color: '#666' }}>Horizontal (0-100):</label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={khatibData.positionX || 50}
                                                            onChange={(e) => handleKhatibChange('positionX', parseInt(e.target.value))}
                                                            style={{ width: '100%', marginTop: 2 }}
                                                        />
                                                        <div style={{ fontSize: '10px', textAlign: 'center', color: '#666' }}>
                                                            {khatibData.positionX || 50}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', color: '#666' }}>Vertical (0-100):</label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={khatibData.positionY || 50}
                                                            onChange={(e) => handleKhatibChange('positionY', parseInt(e.target.value))}
                                                            style={{ width: '100%', marginTop: 2 }}
                                                        />
                                                        <div style={{ fontSize: '10px', textAlign: 'center', color: '#666' }}>
                                                            {khatibData.positionY || 50}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#666', marginTop: 8 }}>
                                                    Sesuaikan posisi untuk memfokuskan pada wajah dalam frame bulat
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleKhatibChange('positionX', 50);
                                                        handleKhatibChange('positionY', 50);
                                                    }}
                                                    style={{
                                                        marginTop: 8,
                                                        padding: '4px 8px',
                                                        fontSize: '11px',
                                                        backgroundColor: '#6c757d',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Reset ke Tengah
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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