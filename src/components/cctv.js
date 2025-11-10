import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/CCTV.css';

const CCTV = ({ mosqueName, setCurrentPage }) => {
    // Initialize cameras from localStorage
    const [cameras, setCameras] = useState(() => {
        const saved = localStorage.getItem('cctvCameras');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error parsing saved cameras:', error);
                return getDefaultCameras();
            }
        }
        return getDefaultCameras();
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editedCameras, setEditedCameras] = useState(cameras);
    const videoRefs = useRef({});
    const hlsInstances = useRef({});
    const retryTimeouts = useRef({});
    const hlsScriptLoaded = useRef(false);

    // Default camera configuration
    function getDefaultCameras() {
        return [
            { id: 1, name: 'Kamera 1', url: 'http://localhost:8888/cam1/index.m3u8' },
            { id: 2, name: 'Kamera 2', url: 'http://localhost:8888/cam2/index.m3u8' },
            { id: 3, name: 'Kamera 3', url: 'http://localhost:8888/cam3/index.m3u8' },
            { id: 4, name: 'Kamera 4', url: 'http://localhost:8888/cam4/index.m3u8' },
        ];
    }

    // Load HLS.js script dynamically
    const loadHlsScript = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (window.Hls) {
                resolve();
                return;
            }
            
            if (hlsScriptLoaded.current) {
                // Script is loading, wait for it
                const checkInterval = setInterval(() => {
                    if (window.Hls) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                return;
            }

            const existingScript = document.querySelector('script[src*="hls.js"]');
            if (existingScript) {
                hlsScriptLoaded.current = true;
                existingScript.addEventListener('load', resolve);
                existingScript.addEventListener('error', reject);
                return;
            }

            hlsScriptLoaded.current = true;
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.7';
            script.async = true;
            script.onload = () => {
                console.log('✅ HLS.js loaded successfully');
                resolve();
            };
            script.onerror = (error) => {
                console.error('❌ Failed to load HLS.js:', error);
                hlsScriptLoaded.current = false;
                reject(error);
            };
            document.head.appendChild(script);
        });
    }, []);

    // Setup RTSP/HLS stream for a camera
    const setupRTSPStream = useCallback(async (videoElement, streamUrl, cameraId) => {
        if (!videoElement || !streamUrl) {
            console.warn(`Skipping setup for camera ${cameraId}: missing element or URL`);
            return;
        }

        try {
            // Load HLS.js if not already loaded
            await loadHlsScript();

            const Hls = window.Hls;

            // Clear any existing retry timeout
            if (retryTimeouts.current[cameraId]) {
                clearTimeout(retryTimeouts.current[cameraId]);
                delete retryTimeouts.current[cameraId];
            }

            // Destroy existing HLS instance
            if (hlsInstances.current[cameraId]) {
                hlsInstances.current[cameraId].destroy();
                delete hlsInstances.current[cameraId];
            }

            if (Hls.isSupported()) {
                console.log(`🎥 Initializing camera ${cameraId}: ${streamUrl}`);
                
                const hls = new Hls({
                    debug: false,
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    maxBufferSize: 60 * 1000 * 1000,
                    maxBufferHole: 0.5,
                    manifestLoadingTimeOut: 10000,
                    manifestLoadingMaxRetry: 3,
                    manifestLoadingRetryDelay: 1000,
                    levelLoadingTimeOut: 10000,
                    levelLoadingMaxRetry: 3,
                    levelLoadingRetryDelay: 1000,
                    fragLoadingTimeOut: 20000,
                    fragLoadingMaxRetry: 6,
                    fragLoadingRetryDelay: 1000,
                    startFragPrefetch: true,
                    testBandwidth: true,
                    // Optimize for live streaming
                    liveSyncDurationCount: 3,
                    liveMaxLatencyDurationCount: 5,
                });
                
                hls.loadSource(streamUrl);
                hls.attachMedia(videoElement);

                // Handle manifest parsed event
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log(`✅ Camera ${cameraId} manifest loaded successfully`);
                    videoElement.play().catch(err => {
                        console.warn(`Camera ${cameraId} autoplay prevented:`, err);
                        // Try with muted
                        videoElement.muted = true;
                        videoElement.play().catch(e => 
                            console.error(`Camera ${cameraId} still cannot play:`, e)
                        );
                    });
                });

                // Handle errors with retry logic
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.warn(`⚠️ Camera ${cameraId} HLS error:`, data.type, data.details);
                    
                    if (data.fatal) {
                        console.error(`❌ Camera ${cameraId} fatal error:`, data.type);
                        
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log(`🔄 Camera ${cameraId}: Network recovery...`);
                                retryTimeouts.current[cameraId] = setTimeout(() => {
                                    if (hlsInstances.current[cameraId]) {
                                        hls.startLoad();
                                    }
                                }, 2000);
                                break;
                                
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log(`🔄 Camera ${cameraId}: Media recovery...`);
                                try {
                                    hls.recoverMediaError();
                                } catch (err) {
                                    console.error(`Camera ${cameraId} media recovery failed:`, err);
                                    retryTimeouts.current[cameraId] = setTimeout(() => {
                                        setupRTSPStream(videoElement, streamUrl, cameraId);
                                    }, 5000);
                                }
                                break;
                                
                            default:
                                console.log(`🔄 Camera ${cameraId}: Restarting stream...`);
                                hls.destroy();
                                delete hlsInstances.current[cameraId];
                                retryTimeouts.current[cameraId] = setTimeout(() => {
                                    setupRTSPStream(videoElement, streamUrl, cameraId);
                                }, 5000);
                                break;
                        }
                    }
                });

                // Handle quality level switching
                hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    console.log(`Camera ${cameraId}: Switched to quality level ${data.level}`);
                });

                // Handle stream ended
                const onEnded = () => {
                    console.log(`🔄 Camera ${cameraId}: Stream ended, reconnecting...`);
                    retryTimeouts.current[cameraId] = setTimeout(() => {
                        setupRTSPStream(videoElement, streamUrl, cameraId);
                    }, 3000);
                };
                videoElement.addEventListener('ended', onEnded);

                // Handle stream stalled
                const onStalled = () => {
                    console.warn(`⚠️ Camera ${cameraId}: Stream stalled`);
                };
                videoElement.addEventListener('stalled', onStalled);

                // Handle waiting (buffering)
                const onWaiting = () => {
                    console.log(`⏳ Camera ${cameraId}: Buffering...`);
                };
                videoElement.addEventListener('waiting', onWaiting);

                // Handle playing
                const onPlaying = () => {
                    console.log(`▶️ Camera ${cameraId}: Playing`);
                };
                videoElement.addEventListener('playing', onPlaying);

                // Store cleanup function
                videoElement._cleanupListeners = () => {
                    videoElement.removeEventListener('ended', onEnded);
                    videoElement.removeEventListener('stalled', onStalled);
                    videoElement.removeEventListener('waiting', onWaiting);
                    videoElement.removeEventListener('playing', onPlaying);
                };

                hlsInstances.current[cameraId] = hls;

            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                console.log(`🎥 Using native HLS for camera ${cameraId}`);
                videoElement.src = streamUrl;
                videoElement.addEventListener('loadedmetadata', () => {
                    videoElement.play().catch(err => 
                        console.warn(`Camera ${cameraId} autoplay prevented:`, err)
                    );
                });
            } else {
                console.error(`❌ HLS not supported in this browser for camera ${cameraId}`);
            }
        } catch (error) {
            console.error(`❌ Failed to setup stream for camera ${cameraId}:`, error);
            // Retry after 5 seconds
            retryTimeouts.current[cameraId] = setTimeout(() => {
                setupRTSPStream(videoElement, streamUrl, cameraId);
            }, 5000);
        }
    }, [loadHlsScript]);

    // Setup streams for all cameras
    useEffect(() => {
        const setupAllStreams = async () => {
            for (let i = 0; i < cameras.length; i++) {
                const camera = cameras[i];
                const videoElement = videoRefs.current[camera.id];
                
                if (videoElement && camera.url) {
                    // Stagger camera initialization to avoid overwhelming the system
                    await new Promise(resolve => setTimeout(resolve, i * 500));
                    setupRTSPStream(videoElement, camera.url, camera.id);
                }
            }
        };

        setupAllStreams();

        // Cleanup function
        return () => {
            console.log('🧹 Cleaning up all camera streams...');
            
            // Clear all retry timeouts
            Object.keys(retryTimeouts.current).forEach(key => {
                clearTimeout(retryTimeouts.current[key]);
            });
            retryTimeouts.current = {};

            // Destroy all HLS instances
            Object.keys(hlsInstances.current).forEach(key => {
                if (hlsInstances.current[key]) {
                    try {
                        hlsInstances.current[key].destroy();
                    } catch (error) {
                        console.warn(`Error destroying HLS instance ${key}:`, error);
                    }
                }
            });
            hlsInstances.current = {};

            // Cleanup video element listeners
            Object.values(videoRefs.current).forEach(video => {
                if (video && video._cleanupListeners) {
                    video._cleanupListeners();
                }
            });
        };
    }, [cameras, setupRTSPStream]);

    // Save cameras to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('cctvCameras', JSON.stringify(cameras));
            console.log('💾 Cameras saved to localStorage');
        } catch (error) {
            console.error('Error saving cameras to localStorage:', error);
        }
    }, [cameras]);

    // Edit mode handlers
    const handleEdit = useCallback(() => {
        setIsEditing(true);
        setEditedCameras([...cameras]);
    }, [cameras]);

    const handleSave = useCallback(() => {
        setCameras(editedCameras);
        setIsEditing(false);
        console.log('✅ Camera configuration saved');
    }, [editedCameras]);

    const handleCancel = useCallback(() => {
        setEditedCameras([...cameras]);
        setIsEditing(false);
        console.log('❌ Edit cancelled');
    }, [cameras]);

    const handleUrlChange = useCallback((id, newUrl) => {
        setEditedCameras(prev =>
            prev.map(cam => cam.id === id ? { ...cam, url: newUrl } : cam)
        );
    }, []);

    const handleNameChange = useCallback((id, newName) => {
        setEditedCameras(prev =>
            prev.map(cam => cam.id === id ? { ...cam, name: newName } : cam)
        );
    }, []);

    const addCamera = useCallback(() => {
        const newId = Math.max(...editedCameras.map(c => c.id), 0) + 1;
        setEditedCameras([...editedCameras, { 
            id: newId, 
            name: `Kamera ${newId}`, 
            url: `http://localhost:8888/cam${newId}/index.m3u8` 
        }]);
        console.log(`➕ Added camera ${newId}`);
    }, [editedCameras]);

    const removeCamera = useCallback((id) => {
        if (editedCameras.length > 1) {
            setEditedCameras(prev => prev.filter(cam => cam.id !== id));
            console.log(`🗑️ Removed camera ${id}`);
        }
    }, [editedCameras.length]);

    const handleBack = useCallback(() => {
        setCurrentPage('welcome');
    }, [setCurrentPage]);

    return (
        <div className="cctv-container">
            {/* Header */}
            <div className="cctv-header">
                <div className="cctv-header-content">
                    <h1>{mosqueName}</h1>
                    <h2>Monitor CCTV</h2>
                </div>
                <div className="cctv-button-group">
                    {!isEditing ? (
                        <>
                            <button 
                                onClick={handleEdit} 
                                className="cctv-btn cctv-btn-primary"
                                aria-label="Edit kamera"
                            >
                                <span>✏️ Edit Kamera</span>
                            </button>
                            <button 
                                onClick={handleBack} 
                                className="cctv-btn cctv-btn-danger"
                                aria-label="Kembali ke halaman utama"
                            >
                                <span>← Kembali</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={addCamera} 
                                className="cctv-btn cctv-btn-secondary"
                                aria-label="Tambah kamera baru"
                            >
                                <span>➕ Tambah Kamera</span>
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="cctv-btn cctv-btn-primary"
                                aria-label="Simpan perubahan"
                            >
                                <span>💾 Simpan</span>
                            </button>
                            <button 
                                onClick={handleCancel} 
                                className="cctv-btn cctv-btn-cancel"
                                aria-label="Batal edit"
                            >
                                <span>✖️ Batal</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Camera Grid */}
            <div className="cctv-grid">
                {(isEditing ? editedCameras : cameras).map((camera) => (
                    <div key={camera.id} className="cctv-card">
                        {isEditing ? (
                            // Edit Mode
                            <>
                                <div className="cctv-form-group">
                                    <label htmlFor={`name-${camera.id}`} className="cctv-label">
                                        Nama Kamera:
                                    </label>
                                    <input
                                        id={`name-${camera.id}`}
                                        type="text"
                                        value={camera.name}
                                        onChange={(e) => handleNameChange(camera.id, e.target.value)}
                                        className="cctv-input"
                                        placeholder="Masukkan nama kamera"
                                        aria-label="Nama kamera"
                                    />
                                </div>
                                <div className="cctv-form-group">
                                    <label htmlFor={`url-${camera.id}`} className="cctv-label">
                                        URL Stream RTSP/HLS (m3u8):
                                    </label>
                                    <input
                                        id={`url-${camera.id}`}
                                        type="text"
                                        value={camera.url}
                                        onChange={(e) => handleUrlChange(camera.id, e.target.value)}
                                        placeholder="http://localhost:8888/cam/index.m3u8"
                                        className="cctv-input"
                                        aria-label="URL stream kamera"
                                    />
                                    <span className="cctv-input-hint">
                                        Contoh: http://localhost:8888/cam1/index.m3u8
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeCamera(camera.id)}
                                    disabled={editedCameras.length <= 1}
                                    className="cctv-btn-remove"
                                    aria-label="Hapus kamera"
                                    title={editedCameras.length <= 1 ? 'Tidak bisa menghapus kamera terakhir' : 'Hapus kamera'}
                                >
                                    🗑️ Hapus Kamera
                                </button>
                            </>
                        ) : (
                            // View Mode
                            <>
                                <h3 className="cctv-card-title">{camera.name}</h3>
                                <div className="cctv-video-wrapper">
                                    {camera.url ? (
                                        <>
                                            <video
                                                ref={el => videoRefs.current[camera.id] = el}
                                                autoPlay
                                                muted
                                                playsInline
                                                className="cctv-video"
                                                aria-label={`Video stream ${camera.name}`}
                                            />
                                            <div className="cctv-live-indicator" aria-live="polite">
                                                <span className="cctv-live-dot" aria-hidden="true"></span>
                                                LIVE
                                            </div>
                                        </>
                                    ) : (
                                        <div className="cctv-empty-stream">
                                            <svg 
                                                className="cctv-empty-icon" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                strokeWidth="2"
                                                aria-hidden="true"
                                            >
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                <circle cx="12" cy="13" r="4"></circle>
                                            </svg>
                                            <p>Tidak ada stream</p>
                                            <p>Klik "Edit Kamera" untuk mengatur URL RTSP</p>
                                        </div>
                                    )}
                                </div>
        
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CCTV;
