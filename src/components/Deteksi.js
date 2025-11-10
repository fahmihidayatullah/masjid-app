import React, { useRef, useState, useEffect } from 'react';
import '../styles/Deteksi.css';

const Deteksi = ({ mosqueName, setCurrentPage }) => {
    // RTSP Video refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    // RTSP Stream URL
    const [rtspStreamUrl] = useState(() => {
        return localStorage.getItem('rtspStreamUrl') || 'http://localhost:8888/cam4/index.m3u8';
    });
    
    // Object Detection & People Counting State
    const [odModel, setOdModel] = useState(null);
    const odAnimRef = useRef(null);
    const [jamaahCount, setJamaahCount] = useState(0);
    const [totalJamaahDetected, setTotalJamaahDetected] = useState(() => {
        try {
            const raw = localStorage.getItem("totalJamaahDetected");
            return raw !== null ? parseInt(raw, 10) || 0 : 0;
        } catch (_) { return 0; }
    });
    
    // Line crossing detection states
    const [entryCount, setEntryCount] = useState(() => {
        try {
            const saved = localStorage.getItem("entryCount");
            return saved ? parseInt(saved, 10) || 0 : 0;
        } catch (_) { return 0; }
    });
    
    const [exitCount, setExitCount] = useState(() => {
        try {
            const saved = localStorage.getItem("exitCount");
            return saved ? parseInt(saved, 10) || 0 : 0;
        } catch (_) { return 0; }
    });
    
    // Detection control states
    const [detectionEnabled, setDetectionEnabled] = useState(() => {
        try {
            const saved = localStorage.getItem("detectionEnabled");
            return saved !== null ? JSON.parse(saved) : true;
        } catch (_) { return true; }
    });
    
    const [showLineConfig, setShowLineConfig] = useState(false);
    
    const [detectionStats, setDetectionStats] = useState({
        processTime: 0,
        isDetecting: false,
        fps: 0,
        totalDetections: 0
    });
    
    // --- Prayer schedule & counts ---
    const defaultSchedule = {
        Subuh: '04:30',
        Dzuhur: '12:00',
        Ashar: '15:15',
        Maghrib: '18:00',
        Isya: '19:15'
    };

    const [prayerSchedule, setPrayerSchedule] = useState(() => {
        try {
            const saved = localStorage.getItem('prayerSchedule');
            return saved ? JSON.parse(saved) : defaultSchedule;
        } catch (_) { return defaultSchedule; }
    });

    const [prayerWindowMinutes, setPrayerWindowMinutes] = useState(() => {
        try {
            const s = localStorage.getItem('prayerWindowMinutes');
            return s ? parseInt(s, 10) : 60;
        } catch (_) { return 60; }
    });

    const getTodayKey = (date = new Date()) => date.toISOString().slice(0,10);

    const loadPrayerCountsForDate = (dateKey = getTodayKey()) => {
        try {
            const raw = localStorage.getItem(`prayerCounts_${dateKey}`);
            if (!raw) {
                const empty = { Subuh:0, Dzuhur:0, Ashar:0, Maghrib:0, Isya:0 };
                localStorage.setItem(`prayerCounts_${dateKey}`, JSON.stringify(empty));
                return empty;
            }
            return JSON.parse(raw);
        } catch (e) {
            const empty = { Subuh:0, Dzuhur:0, Ashar:0, Maghrib:0, Isya:0 };
            localStorage.setItem(`prayerCounts_${dateKey}`, JSON.stringify(empty));
            return empty;
        }
    };

    const [prayerCounts, setPrayerCounts] = useState(() => loadPrayerCountsForDate(getTodayKey()));

    useEffect(() => {
        localStorage.setItem('prayerSchedule', JSON.stringify(prayerSchedule));
    }, [prayerSchedule]);

    useEffect(() => {
        localStorage.setItem('prayerWindowMinutes', String(prayerWindowMinutes));
    }, [prayerWindowMinutes]);

    useEffect(() => {
        const interval = setInterval(() => {
            const loaded = loadPrayerCountsForDate(getTodayKey());
            setPrayerCounts(loaded);
        }, 60_000);
        return () => clearInterval(interval);
    }, []);

    const timeStringToTodayDate = (timeStr) => {
        const [hh, mm] = timeStr.split(':').map(s => parseInt(s,10));
        const d = new Date();
        d.setHours(hh, mm, 0, 0);
        return d;
    };

    const findPrayerForTimestamp = (timestamp) => {
        const ts = new Date(timestamp);
        for (const [prayerName, timeStr] of Object.entries(prayerSchedule)) {
            const start = timeStringToTodayDate(timeStr);
            const end = new Date(start.getTime() + prayerWindowMinutes * 60_000);
            if (ts >= start && ts < end) {
                return prayerName;
            }
        }
        return null;
    };

    const savePrayerCountsForDate = (dateKey, countsObj) => {
        try {
            localStorage.setItem(`prayerCounts_${dateKey}`, JSON.stringify(countsObj));
        } catch (e) {
            console.error('Failed save prayer counts:', e);
        }
    };

    const recordPrayerCount = (timestamp) => {
    const prayerName = findPrayerForTimestamp(timestamp);
    if (!prayerName) return null;
    const dateKey = getTodayKey(new Date(timestamp));
    const current = loadPrayerCountsForDate(dateKey);

    // hanya naikkan 1 jika belum melebihi entryCount global
    const totalEntry = parseInt(localStorage.getItem("entryCount") || "0", 10);
    const totalAllPrayer = Object.values(current).reduce((a, b) => a + b, 0);

    if (totalAllPrayer < totalEntry) {
        current[prayerName] = (current[prayerName] || 0) + 1;
        savePrayerCountsForDate(dateKey, current);
        setPrayerCounts(current);
        return prayerName;
    }
    return null;
};

    const detectedPersonsRef = useRef(new Map());
    const personIdCounterRef = useRef(0);
    const lastSeenRef = useRef(new Map());
    const totalUniqueRef = useRef(totalJamaahDetected || 0);
    const frameCountRef = useRef(0);
    const lastFpsTimeRef = useRef(Date.now());
    const personTrajectoryRef = useRef(new Map());
    const crossingEventsRef = useRef(new Map());
    const personStateRef = useRef(new Map());
    
    const [detectionLines, setDetectionLines] = useState(() => {
        const saved = localStorage.getItem('detectionLines');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (_) {}
        }
        return {
            entry: {
                centerX: 0.5,
                centerY: 0.3,
                length: 0.8,
                angle: 0,
                color: '#00FF00',
                label: 'MASUK',
                zone: 'entry'
            },
            exit: {
                centerX: 0.5,
                centerY: 0.7,
                length: 0.8,
                angle: 0,
                color: '#FF0000',
                label: 'KELUAR',
                zone: 'exit'
            }
        };
    });
    
    const saveLineConfig = (newConfig) => {
        setDetectionLines(newConfig);
        localStorage.setItem('detectionLines', JSON.stringify(newConfig));
    };
    
    const getLineEndpoints = (line, videoWidth, videoHeight) => {
        const centerX = line.centerX * videoWidth;
        const centerY = line.centerY * videoHeight;
        const halfLength = (line.length * Math.min(videoWidth, videoHeight)) / 2;
        
        const angleRad = (line.angle * Math.PI) / 180;
        const dx = halfLength * Math.cos(angleRad);
        const dy = halfLength * Math.sin(angleRad);
        
        return {
            x1: centerX - dx,
            y1: centerY - dy,
            x2: centerX + dx,
            y2: centerY + dy,
            centerX,
            centerY
        };
    };
    
    const checkLineCrossing = (personId, currentCenter, videoWidth, videoHeight) => {
        const trajectory = personTrajectoryRef.current.get(personId) || [];
        
        trajectory.push({
            x: currentCenter.x,
            y: currentCenter.y,
            timestamp: Date.now()
        });
        
        if (trajectory.length > 20) {
            trajectory.shift();
        }
        
        personTrajectoryRef.current.set(personId, trajectory);
        
        if (trajectory.length < 3) return;
        
        const currentState = personStateRef.current.get(personId) || { 
            entryZone: 'unknown', 
            exitZone: 'unknown',
            lastEntryTime: 0,
            lastExitTime: 0
        };
        
        Object.entries(detectionLines).forEach(([lineKey, lineConfig]) => {
            const lineEndpoints = getLineEndpoints(lineConfig, videoWidth, videoHeight);
            const currentZone = determinePersonZone(currentCenter, lineEndpoints, lineConfig);
            const previousZone = currentState[`${lineConfig.zone}Zone`];
            
            if (previousZone !== 'unknown' && previousZone !== currentZone && currentZone !== 'on_line') {
                const now = Date.now();
                const lastCrossingTime = currentState[`last${lineConfig.zone.charAt(0).toUpperCase() + lineConfig.zone.slice(1)}Time`];
                
                if (now - lastCrossingTime > 2000) {
                    if (validateCrossing(trajectory, lineEndpoints, lineConfig.zone)) {
                        if (lineConfig.zone === 'entry') {
                            setEntryCount(prev => {
                                const newCount = prev + 1;
                                localStorage.setItem("entryCount", String(newCount));
                                
                                // ✅ ONLY record prayer count for ENTRY
                                const prayerName = recordPrayerCount(now);
                                
                                // Update total
                                totalUniqueRef.current += 1;
                                setTotalJamaahDetected(totalUniqueRef.current);
                                localStorage.setItem("totalJamaahDetected", String(totalUniqueRef.current));
                                
                                console.log(`✅ Entry detected for person ${personId} at ${new Date().toLocaleTimeString()} (prayer: ${prayerName || 'N/A'})`);
                                return newCount;
                            });
                            currentState.lastEntryTime = now;
                        } else if (lineConfig.zone === 'exit') {
                            setExitCount(prev => {
                                const newCount = prev + 1;
                                localStorage.setItem("exitCount", String(newCount));
                                
                                // ❌ NO prayer count recording for EXIT
                                console.log(`✅ Exit detected for person ${personId} at ${new Date().toLocaleTimeString()}`);
                                return newCount;
                            });
                            currentState.lastExitTime = now;
                        }
                    }
                }
            }
            
            currentState[`${lineConfig.zone}Zone`] = currentZone;
        });
        
        personStateRef.current.set(personId, currentState);
    };
    
    const determinePersonZone = (point, lineEndpoints, lineConfig) => {
        const { x1, y1, x2, y2 } = lineEndpoints;
        const crossProduct = (x2 - x1) * (point.y - y1) - (y2 - y1) * (point.x - x1);
        const distance = Math.abs(crossProduct) / Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        if (distance < 20) return 'on_line';
        return crossProduct > 0 ? 'positive_side' : 'negative_side';
    };
    
    const validateCrossing = (trajectory, lineEndpoints, zone) => {
        if (trajectory.length < 5) return false;
        
        const recentPoints = trajectory.slice(-5);
        let crossingsDetected = 0;
        
        for (let i = 1; i < recentPoints.length; i++) {
            const p1 = recentPoints[i - 1];
            const p2 = recentPoints[i];
            
            if (lineSegmentIntersection(p1, p2, lineEndpoints)) {
                crossingsDetected++;
            }
        }
        
        const firstPoint = recentPoints[0];
        const lastPoint = recentPoints[recentPoints.length - 1];
        const totalMovement = Math.sqrt(
            (lastPoint.x - firstPoint.x) ** 2 + 
            (lastPoint.y - firstPoint.y) ** 2
        );
        
        return crossingsDetected >= 1 && totalMovement > 8;
    };
    
    const lineSegmentIntersection = (p1, p2, line) => {
        const { x1, y1, x2, y2 } = line;
        const denom = (x1 - x2) * (p1.y - p2.y) - (y1 - y2) * (p1.x - p2.x);
        if (Math.abs(denom) < 0.001) return false;
        const t = ((x1 - p1.x) * (p1.y - p2.y) - (y1 - p1.y) * (p1.x - p2.x)) / denom;
        const u = -((x1 - x2) * (y1 - p1.y) - (y1 - y2) * (x1 - p1.x)) / denom;
        return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
    };
    
    const drawDetectionLines = (ctx, videoWidth, videoHeight) => {
        if (!videoWidth || !videoHeight) return;
        
        Object.entries(detectionLines).forEach(([key, line]) => {
            const endpoints = getLineEndpoints(line, videoWidth, videoHeight);
            
            ctx.save();
            ctx.strokeStyle = line.color;
            ctx.lineWidth = 8;
            ctx.setLineDash([25, 15]);
            ctx.shadowColor = line.color;
            ctx.shadowBlur = 20;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.9;
            
            ctx.beginPath();
            ctx.moveTo(endpoints.x1, endpoints.y1);
            ctx.lineTo(endpoints.x2, endpoints.y2);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#FFFFFF';
            ctx.setLineDash([15, 10]);
            
            ctx.beginPath();
            ctx.moveTo(endpoints.x1, endpoints.y1);
            ctx.lineTo(endpoints.x2, endpoints.y2);
            ctx.stroke();
            
            ctx.setLineDash([]);
            ctx.fillStyle = line.color;
            ctx.shadowColor = line.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(endpoints.centerX, endpoints.centerY, 10, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(endpoints.centerX, endpoints.centerY, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            drawLineArrows(ctx, endpoints, line.color);
            
            const labelX = endpoints.centerX;
            const labelY = endpoints.centerY - 50;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.strokeStyle = line.color;
            ctx.lineWidth = 2;
            const labelWidth = 100;
            const labelHeight = 35;
            ctx.fillRect(labelX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight);
            ctx.strokeRect(labelX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight);
            
            ctx.fillStyle = line.color;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(line.label, labelX, labelY - 5);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`${line.angle}°`, labelX, labelY + 8);
            
            ctx.restore();
        });
        
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.lineCap = 'butt';
        ctx.globalAlpha = 1.0;
    };
    
    const drawLineArrows = (ctx, endpoints, color) => {
        const { x1, y1, x2, y2 } = endpoints;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        [
            { x: x1 + (x2 - x1) * 0.25, y: y1 + (y2 - y1) * 0.25, dir: 1 },
            { x: x1 + (x2 - x1) * 0.75, y: y1 + (y2 - y1) * 0.75, dir: 1 }
        ].forEach(arrow => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            const arrowX1 = arrow.x - arrowLength * Math.cos(angle - arrowAngle);
            const arrowY1 = arrow.y - arrowLength * Math.sin(angle - arrowAngle);
            const arrowX2 = arrow.x - arrowLength * Math.cos(angle + arrowAngle);
            const arrowY2 = arrow.y - arrowLength * Math.sin(angle + arrowAngle);
            
            ctx.moveTo(arrow.x, arrow.y);
            ctx.lineTo(arrowX1, arrowY1);
            ctx.moveTo(arrow.x, arrow.y);
            ctx.lineTo(arrowX2, arrowY2);
            ctx.stroke();
        });
    };

    const toggleDetection = () => {
        const newState = !detectionEnabled;
        setDetectionEnabled(newState);
        localStorage.setItem("detectionEnabled", JSON.stringify(newState));
        
        if (!newState) {
            setJamaahCount(0);
            detectedPersonsRef.current.clear();
            lastSeenRef.current.clear();
            personTrajectoryRef.current.clear();
            crossingEventsRef.current.clear();
            personStateRef.current.clear();
            setDetectionStats(prev => ({
                ...prev,
                isDetecting: false,
                fps: 0
            }));
            
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    };
    
    const resetTotalCount = () => {
        if (window.confirm("Apakah Anda yakin ingin reset semua data deteksi?")) {
            setTotalJamaahDetected(0);
            setEntryCount(0);
            setExitCount(0);
            totalUniqueRef.current = 0;
            localStorage.setItem("totalJamaahDetected", "0");
            localStorage.setItem("entryCount", "0");
            localStorage.setItem("exitCount", "0");
            
            detectedPersonsRef.current.clear();
            lastSeenRef.current.clear();
            personTrajectoryRef.current.clear();
            crossingEventsRef.current.clear();
            personStateRef.current.clear();
            personIdCounterRef.current = 0;
            setJamaahCount(0);

            const todayKey = getTodayKey();
            const empty = { Subuh:0, Dzuhur:0, Ashar:0, Maghrib:0, Isya:0 };
            savePrayerCountsForDate(todayKey, empty);
            setPrayerCounts(empty);
        }
    };

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    useEffect(() => {
        let cancelled = false;
        const loadModel = async () => {
            try {
                if (!window.tf) {
                    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
                }
                if (!window.cocoSsd) {
                    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd");
                }
                const m = await window.cocoSsd.load();
                if (!cancelled) {
                    setOdModel(m);
                    console.log("✅ COCO-SSD loaded");
                }
            } catch (e) {
                console.error("❌ Failed loading detection libs:", e);
            }
        };
        loadModel();
        return () => { cancelled = true; };
    }, []);

    const calculateIoU = (boxA, boxB) => {
        const [x1A, y1A, wA, hA] = boxA;
        const [x1B, y1B, wB, hB] = boxB;
        
        const x2A = x1A + wA;
        const y2A = y1A + hA;
        const x2B = x1B + wB;
        const y2B = y1B + hB;

        const xA = Math.max(x1A, x1B);
        const yA = Math.max(y1A, y1B);
        const xB = Math.min(x2A, x2B);
        const yB = Math.min(y2A, y2B);

        const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
        const boxAArea = wA * hA;
        const boxBArea = wB * hB;
        const unionArea = boxAArea + boxBArea - interArea;

        return unionArea > 0 ? interArea / unionArea : 0;
    };

    const applyNMS = (detections, iouThreshold = 0.3) => {
        if (detections.length === 0) return [];

        const result = [];
        const sorted = [...detections].sort((a, b) => b.score - a.score);

        while (sorted.length > 0) {
            const current = sorted.shift();
            
            const [x, y, width, height] = current.bbox;
            const aspectRatio = width / height;
            
            if (width > 200 && aspectRatio > 1.8) {
                continue;
            }
            
            result.push(current);

            for (let i = sorted.length - 1; i >= 0; i--) {
                const iou = calculateIoU(current.bbox, sorted[i].bbox);
                if (iou > iouThreshold) {
                    sorted.splice(i, 1);
                }
            }
        }

        return result;
    };

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawLinesOnly = () => {
            if (video.videoWidth && video.videoHeight) {
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawDetectionLines(ctx, video.videoWidth, video.videoHeight);
            }
        };

        if (!odModel || !detectionEnabled) {
            drawLinesOnly();
            const interval = setInterval(drawLinesOnly, 100);
            return () => clearInterval(interval);
        }

        const detectObjects = async () => {
            if (video.readyState >= 2 && detectionEnabled) {
                const startTime = Date.now();
                
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }

                try {
                    const predictions = await odModel.detect(video, undefined, 0.35);
                    
                    let jamaah = predictions.filter(pred => {
                        if (pred.class !== 'person' || pred.score < 0.6) return false;
                        
                        const [x, y, width, height] = pred.bbox;
                        const aspectRatio = width / height;
                        const area = width * height;
                        
                        return (
                            width < video.videoWidth * 0.4 &&
                            height < video.videoHeight * 0.8 &&
                            width > 25 &&
                            height > 40 &&
                            aspectRatio < 3.0 &&
                            aspectRatio > 0.2 &&
                            area < (video.videoWidth * video.videoHeight * 0.2)
                        );
                    });

                    jamaah.sort((a, b) => b.score - a.score);
                    jamaah = applyNMS(jamaah, 0.25);

                    const processTime = Date.now() - startTime;
                    const currentTimestamp = Date.now();

                    const currentDetections = jamaah.map((detection, index) => ({
                        bbox: detection.bbox,
                        score: detection.score,
                        center: {
                            x: detection.bbox[0] + detection.bbox[2] / 2,
                            y: detection.bbox[1] + detection.bbox[3] / 2
                        },
                        area: detection.bbox[2] * detection.bbox[3],
                        id: null
                    }));

                    const cleanupThreshold = currentTimestamp - 4000;
                    for (let [personId, lastSeen] of lastSeenRef.current.entries()) {
                        if (lastSeen < cleanupThreshold) {
                            lastSeenRef.current.delete(personId);
                            detectedPersonsRef.current.delete(personId);
                            personTrajectoryRef.current.delete(personId);
                            personStateRef.current.delete(personId);
                        }
                    }

                    const matchedIds = new Set();
                    
                    currentDetections.forEach(detection => {
                        let bestMatch = null;
                        let bestDistance = Infinity;
                        
                        for (let [personId, personData] of detectedPersonsRef.current.entries()) {
                            if (matchedIds.has(personId)) continue;
                            
                            const lastSeen = lastSeenRef.current.get(personId);
                            if (!lastSeen || currentTimestamp - lastSeen > 2500) continue;
                            
                            const distance = Math.sqrt(
                                Math.pow(detection.center.x - personData.center.x, 2) +
                                Math.pow(detection.center.y - personData.center.y, 2)
                            );
                            
                            const maxDistance = Math.max(120, Math.sqrt(detection.area) * 0.7);
                            
                            if (distance < maxDistance && distance < bestDistance) {
                                bestMatch = personId;
                                bestDistance = distance;
                            }
                        }
                        
                        if (bestMatch) {
                            detection.id = bestMatch;
                            matchedIds.add(bestMatch);
                            detectedPersonsRef.current.set(bestMatch, {
                                center: detection.center,
                                area: detection.area,
                                firstSeen: detectedPersonsRef.current.get(bestMatch).firstSeen,
                                lastUpdated: currentTimestamp
                            });
                            lastSeenRef.current.set(bestMatch, currentTimestamp);
                            
                            checkLineCrossing(bestMatch, detection.center, video.videoWidth, video.videoHeight);
                            
                        } else {
                            personIdCounterRef.current++;
                            const newPersonId = personIdCounterRef.current;
                            detection.id = newPersonId;
                            
                            detectedPersonsRef.current.set(newPersonId, {
                                center: detection.center,
                                area: detection.area,
                                firstSeen: currentTimestamp,
                                lastUpdated: currentTimestamp
                            });
                            lastSeenRef.current.set(newPersonId, currentTimestamp);
                            
                            personTrajectoryRef.current.set(newPersonId, [{
                                x: detection.center.x,
                                y: detection.center.y,
                                timestamp: currentTimestamp
                            }]);
                            
                            personStateRef.current.set(newPersonId, {
                                entryZone: 'unknown',
                                exitZone: 'unknown',
                                lastEntryTime: 0,
                                lastExitTime: 0
                            });
                        }
                    });

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawDetectionLines(ctx, video.videoWidth, video.videoHeight);

                    currentDetections.forEach((detection, index) => {
                        const [x, y, width, height] = detection.bbox;
                        const jamaahNumber = detection.id || (index + 1);

                        ctx.strokeStyle = '#10B981';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x, y, width, height);

                        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
                        ctx.fillRect(x, y, width, height);

                        const labelText = `J-${jamaahNumber}`;
                        const labelWidth = Math.max(70, labelText.length * 8);
                        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
                        ctx.fillRect(x, y - 28, labelWidth, 24);

                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 13px Arial';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(labelText, x + 4, y - 16);

                        const trajectory = personTrajectoryRef.current.get(detection.id);
                        if (trajectory && trajectory.length > 2) {
                            ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(trajectory[0].x, trajectory[0].y);
                            for (let i = 1; i < trajectory.length; i++) {
                                const alpha = i / trajectory.length;
                                ctx.globalAlpha = alpha * 0.8;
                                ctx.lineTo(trajectory[i].x, trajectory[i].y);
                            }
                            ctx.stroke();
                            ctx.globalAlpha = 1.0;
                        }

                        ctx.fillStyle = '#FFD700';
                        ctx.beginPath();
                        ctx.arc(detection.center.x, detection.center.y, 4, 0, 2 * Math.PI);
                        ctx.fill();
                    });

                    setJamaahCount(currentDetections.length);

                    setDetectionStats(prev => ({
                        ...prev,
                        processTime,
                        isDetecting: true,
                        totalDetections: prev.totalDetections + 1
                    }));

                    frameCountRef.current++;
                    const now = Date.now();
                    if (now - lastFpsTimeRef.current >= 1000) {
                        setDetectionStats(prev => ({
                            ...prev,
                            fps: frameCountRef.current
                        }));
                        frameCountRef.current = 0;
                        lastFpsTimeRef.current = now;
                    }

                } catch (error) {
                    console.error('Detection error:', error);
                }
            }
            
            odAnimRef.current = requestAnimationFrame(detectObjects);
        };

        odAnimRef.current = requestAnimationFrame(detectObjects);
        return () => { 
            if (odAnimRef.current) cancelAnimationFrame(odAnimRef.current); 
            detectedPersonsRef.current.clear();
            lastSeenRef.current.clear();
            personTrajectoryRef.current.clear();
            crossingEventsRef.current.clear();
            personStateRef.current.clear();
        };
    }, [odModel, detectionEnabled, detectionLines, prayerSchedule, prayerWindowMinutes]);

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        const ctxEl = canvasEl.getContext('2d');

        const drawLinesInterval = setInterval(() => {
            if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                if (canvasEl.width !== videoEl.videoWidth || canvasEl.height !== videoEl.videoHeight) {
                    canvasEl.width = videoEl.videoWidth;
                    canvasEl.height = videoEl.videoHeight;
                }
                
                if (!detectionEnabled || !odModel) {
                    ctxEl.clearRect(0, 0, canvasEl.width, canvasEl.height);
                    drawDetectionLines(ctxEl, videoEl.videoWidth, videoEl.videoHeight);
                }
            }
        }, 100);

        return () => clearInterval(drawLinesInterval);
    }, [detectionLines, detectionEnabled, odModel]);

    const setupRTSPStream = async () => {
        const video = videoRef.current;
        if (!video || !rtspStreamUrl) return;

        try {
            if (!window.Hls) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.12/hls.min.js');
            }

            const Hls = window.Hls;

            if (Hls.isSupported()) {
                const hls = new Hls({
                    debug: false,
                    enableWorker: false,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                
                hls.loadSource(rtspStreamUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(err => console.warn("Autoplay prevented:", err));
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        console.error('HLS.js fatal error:', data);
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                setTimeout(() => setupRTSPStream(), 5000);
                                break;
                        }
                    }
                });

                videoRef.current.hlsInstance = hls;

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = rtspStreamUrl;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(err => console.warn("Autoplay prevented:", err));
                });
            } else {
                console.error('HLS not supported in this browser.');
            }
        } catch (error) {
            console.error('Failed to setup RTSP stream:', error);
        }
    };

    useEffect(() => {
        setupRTSPStream();

        return () => {
            const video = videoRef.current;
            if (video && video.hlsInstance) {
                video.hlsInstance.destroy();
            }
        };
    }, []);

    const handlePrayerTimeChange = (prayerName, value) => {
        const newSched = { ...prayerSchedule, [prayerName]: value };
        setPrayerSchedule(newSched);
    };

    const handleWindowMinutesChange = (value) => {
        const v = parseInt(value, 10) || 60;
        setPrayerWindowMinutes(v);
    };

    const formatTime = (t) => {
        return t;
    };

    const isPrayerActiveNow = (prayerName) => {
        const now = Date.now();
        const start = timeStringToTodayDate(prayerSchedule[prayerName]);
        const end = new Date(start.getTime() + prayerWindowMinutes * 60_000);
        return now >= start.getTime() && now < end.getTime();
    };

    return (
        <div className="deteksi-tv-container">
            <div className="deteksi-mosque-header">
                <div className="deteksi-mosque-name-area">{mosqueName}</div>
                <div className="deteksi-header-controls">
                    <button
                        className="deteksi-close-header-btn"
                        onClick={() => setCurrentPage('welcome')}
                        title="Kembali ke Home"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="deteksi-content-area">
                <div className="deteksi-background-container">
                    <div className="deteksi-rtsp-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="deteksi-rtsp-video"
                        />
                        <canvas
                            ref={canvasRef}
                            className="deteksi-rtsp-canvas"
                        />
                        
                        <div className="deteksi-jamaah-stats-overlay" style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(74, 47, 0, 0.9)',
                            color: '#fff',
                            padding: '14px 18px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            lineHeight: 1.4,
                            zIndex: 30,
                            minWidth: '300px',
                            fontFamily: 'Arial, sans-serif',
                            backdropFilter: 'blur(5px)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ marginRight: '8px', fontSize: '18px' }}>🕌</span>
                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Deteksi Jamaah Live</div>
                            </div>
                            
                            <div style={{ marginBottom: '6px' }}>
                                <span style={{ color: '#FFD700' }}>Terdeteksi Saat Ini:</span> <strong style={{ fontSize: '16px' }}>{jamaahCount}</strong>
                            </div>
                            
                            <div style={{ marginBottom: '6px' }}>
                                <span style={{ color: '#00FF00' }}>✅ Masuk:</span> <strong>{entryCount}</strong>
                                <span style={{ color: '#FF6B6B', marginLeft: '20px' }}>❌ Keluar:</span> <strong>{exitCount}</strong>
                            </div>
                            
                            <div style={{ marginBottom: '6px' }}>
                                <span style={{ color: '#87CEEB' }}>👥 Jamaah di Dalam:</span> <strong style={{ color: Math.max(0, entryCount - exitCount) > 0 ? '#00FF00' : '#FF6B6B' }}>{Math.max(0, entryCount - exitCount)}</strong>
                            </div>
                            
                            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '10px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '6px' }}>
                                Status: <span style={{ color: detectionEnabled ? (detectionStats.isDetecting ? '#00FF00' : '#FFFF00') : '#FF6B6B' }}>
                                    {detectionEnabled ? (detectionStats.isDetecting ? '🟢 Aktif' : '🟡 Siap') : '🔴 Nonaktif'}
                                </span>
                                {detectionStats.fps > 0 && (
                                    <span style={{ marginLeft: '10px' }}>| FPS: {detectionStats.fps}</span>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={toggleDetection}
                                    style={{
                                        background: detectionEnabled ? '#DC2626' : '#10B981',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '5px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        minWidth: '70px'
                                    }}
                                    title={detectionEnabled ? 'Nonaktifkan Deteksi' : 'Aktifkan Deteksi'}
                                >
                                    {detectionEnabled ? 'STOP' : 'START'}
                                </button>
                                <button
                                    onClick={() => setShowLineConfig(!showLineConfig)}
                                    style={{
                                        background: '#6B46C1',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '5px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                    title="Pengaturan Garis Deteksi"
                                >
                                    ATUR
                                </button>
                                <button
                                    onClick={resetTotalCount}
                                    style={{
                                        background: '#F59E0B',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '5px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                    title="Reset Semua Data"
                                >
                                    RESET
                                </button>
                            </div>
                        </div>
                        
                        {showLineConfig && (
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'rgba(73, 30, 0, 0.9)',
                                color: '#fff',
                                padding: '20px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                zIndex: 35,
                                minWidth: '350px',
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                fontFamily: 'Arial, sans-serif',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '15px', textAlign: 'center', fontSize: '16px', color: '#FFD700' }}>
                                    ⚙️ Pengaturan Garis Deteksi & Sholat
                                </div>
                                
                                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,255,0,0.08)', borderRadius: '8px', border: '1px solid rgba(0,255,0,0.15)' }}>
                                    <div style={{ color: '#00FF00', fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
                                        🟢 Garis Masuk
                                    </div>
                                    
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px' }}>Posisi X (%):</label>
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="90" 
                                            value={detectionLines.entry.centerX * 100}
                                            onChange={(e) => {
                                                const newX = parseInt(e.target.value) / 100;
                                                saveLineConfig({
                                                    ...detectionLines,
                                                    entry: { ...detectionLines.entry, centerX: newX }
                                                });
                                            }}
                                            style={{ width: '100%', marginBottom: '4px' }}
                                        />
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{Math.round(detectionLines.entry.centerX * 100)}%</span>
                                    </div>
                                    
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px' }}>Posisi Y (%):</label>
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="90" 
                                            value={detectionLines.entry.centerY * 100}
                                            onChange={(e) => {
                                                const newY = parseInt(e.target.value) / 100;
                                                saveLineConfig({
                                                    ...detectionLines,
                                                    entry: { ...detectionLines.entry, centerY: newY }
                                                });
                                            }}
                                            style={{ width: '100%', marginBottom: '4px' }}
                                        />
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{Math.round(detectionLines.entry.centerY * 100)}%</span>
                                    </div>
                                    
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px' }}>Panjang Garis (%):</label>
                                        <input 
                                            type="range" 
                                            min="20" 
                                            max="100" 
                                            value={detectionLines.entry.length * 100}
                                            onChange={(e) => {
                                                const newLength = parseInt(e.target.value) / 100;
                                                saveLineConfig({
                                                    ...detectionLines,
                                                    entry: { ...detectionLines.entry, length: newLength }
                                                });
                                            }}
                                            style={{ width: '100%', marginBottom: '4px' }}
                                        />
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{Math.round(detectionLines.entry.length * 100)}%</span>
                                    </div>
                                    
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px' }}>Rotasi (°):</label>
                                        <input 
                                            type="range" 
                                            min="-180" 
                                            max="180" 
                                            value={detectionLines.entry.angle}
                                            onChange={(e) => {
                                                const newAngle = parseInt(e.target.value);
                                                saveLineConfig({
                                                    ...detectionLines,
                                                    entry: { ...detectionLines.entry, angle: newAngle }
                                                });
                                            }}
                                            style={{ width: '100%', marginBottom: '4px' }}
                                        />
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{detectionLines.entry.angle}°</span>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,0,0,0.08)', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.15)' }}>
                                    <div style={{ color: '#FF0000', fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
                                        🔴 Garis Keluar
                                    </div>
                                    
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px' }}>Posisi X (%):</label>
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="90" 
                                            value={detectionLines.exit.centerX * 100}
                                            onChange={(e) => {
                                                const newX = parseInt(e.target.value) / 100;
                                                saveLineConfig({
                                                    ...detectionLines,
                                                    exit: { ...detectionLines.exit, centerX: newX }
                                                });
                                            }}
                                            style={{ width: '100%', marginBottom: '4px' }}
                                        />
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{Math.round(detectionLines.exit.centerX * 100)}%</span>
                                    </div>
                                    
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px' }}>Posisi Y (%):</label>
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="90" 
                                            value={detectionLines.exit.centerY * 100}
                                            onChange={(e) => {
                                                const newY = parseInt(e.target.value) / 100;
                                                saveLineConfig({
                                                    ...detectionLines,
                                                    exit: { ...detectionLines.exit, centerY: newY }
                                                });
                                            }}
                                            style={{ width: '100%', marginBottom: '4px' }}
                                        />
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{Math.round(detectionLines.exit.centerY * 100)}%</span>
                                    </div>
                                    
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px' }}>Panjang Garis (%):</label>
                                        <input 
                                            type="range" 
                                            min="20" 
                                            max="100" 
                                            value={detectionLines.exit.length * 100}
                                            onChange={(e) => {
                                                const newLength = parseInt(e.target.value) / 100;
                                                saveLineConfig({
                                                    ...detectionLines,
                                                    exit: { ...detectionLines.exit, length: newLength }
                                                });
                                            }}
                                            style={{ width: '100%', marginBottom: '4px' }}
                                        />
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{Math.round(detectionLines.exit.length * 100)}%</span>
                                    </div>
                                    
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '4px' }}>Rotasi (°):</label>
                                        <input 
                                            type="range" 
                                            min="-180" 
                                            max="180" 
                                            value={detectionLines.exit.angle}
                                            onChange={(e) => {
                                                const newAngle = parseInt(e.target.value);
                                                saveLineConfig({
                                                    ...detectionLines,
                                                    exit: { ...detectionLines.exit, angle: newAngle }
                                                });
                                            }}
                                            style={{ width: '100%', marginBottom: '4px' }}
                                        />
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{detectionLines.exit.angle}°</span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(80,80,80,0.08)', borderRadius: '6px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#FFD700', marginBottom: '8px' }}>🕘 Pengaturan Waktu Sholat (hari ini)</div>
                                    {['Subuh','Dzuhur','Ashar','Maghrib','Isya'].map(name => (
                                        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <div style={{ width: '70px', fontWeight: '600' }}>{name}</div>
                                            <input
                                                type="time"
                                                value={prayerSchedule[name]}
                                                onChange={(e) => handlePrayerTimeChange(name, e.target.value)}
                                                style={{ flex: '1' }}
                                            />
                                            <div style={{ width: '70px', textAlign: 'right', fontWeight: '600' }}>{prayerCounts[name] ?? 0}</div>
                                        </div>
                                    ))}

                                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <label style={{ fontSize: '12px' }}>Hingga (menit):</label>
                                        <input type="number" min="5" max="240" value={prayerWindowMinutes} onChange={(e) => handleWindowMinutesChange(e.target.value)} style={{ width: '80px' }} />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowLineConfig(false)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#059669',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✅ Terapkan Pengaturan
                                </button>
                            </div>
                        )}
                        
                        <div style={{
                            position: 'absolute',
                            right: '10px',
                            bottom: '10px',
                            background: 'rgba(74, 33, 0, 0.85)',
                            color: '#fff',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            zIndex: 20,
                            maxWidth: '340px',
                            fontFamily: 'Arial, sans-serif',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255,215,0,0.3)'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#FFD700', fontSize: '14px' }}>
                                🕌 Jamaah Masuk per Waktu Sholat
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '10px', fontStyle: 'italic', color: '#FCD34D' }}>
                                (Hanya menghitung yang masuk melewati garis hijau)
                            </div>
                            {['Subuh','Dzuhur','Ashar','Maghrib','Isya'].map(name => {
                                const active = isPrayerActiveNow(name);
                                return (
                                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? '#34D399' : '#6B7280' }} />
                                            <div style={{ minWidth: '70px' }}>{name}</div>
                                            <div style={{ opacity: 0.85 }}>{formatTime(prayerSchedule[name])}</div>
                                        </div>
                                        <div style={{ fontWeight: '700', color: active ? '#34D399' : '#FFFFFF' }}>{prayerCounts[name] ?? 0}</div>
                                    </div>
                                );
                            })}
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '6px' }}>Hingga: {prayerWindowMinutes} menit</div>
                        </div>

                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            zIndex: 20,
                            maxWidth: '200px',
                            wordBreak: 'break-all',
                            backdropFilter: 'blur(5px)'
                        }}>
                             {rtspStreamUrl ? 'Live' : 'Tidak Ada Stream'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Deteksi;