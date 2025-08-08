import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';
import isEqual from 'lodash/isEqual';

// --- (initial state and helper functions remain the same) ---
// --- MOCK DATA: Remove or replace with your actual data ---
const initialJsonData = {
  filetype: "jardesigner",
  version: "1.0",
  fileinfo: { creator: "", modelNotes: "", licence: "CC BY" },
  modelPath: "/model",
  diffusionLength: 2e-6,
  turnOffElec: false,
  useGssa: false,
  odeMethod: "lsoda",
  verbose: false,
  combineSegments: true,
  stealCellFromLibrary: false,
  benchmark: false,
  temperature: 32,
  randseed: 1234,
  runtime: 0.3,
  elecDt: 50e-6,
  elecPlotDt: 100e-6,
  chemDt: 0.1,
  chemPlotDt: 1.0,
  diffDt: 10e-3,
  funcDt: 100e-6,
  statusDt: 0.0,
  cellProto: {},
  passiveDistrib: [],
  spineProto: [],
  spineDistrib: [],
  chanProto: [],
  chanDistrib: [],
  chemProto: [],
  chemDistrib: [],
  adaptors: [],
  plots: [],
  files: [],
  moogli: [],
  displayMoogli: {},
  moogliEvents: [],
  stims: []
};

const requiredKeys = ["filetype", "version"];
const API_BASE_URL = 'http://localhost:5000';

const isSameSelection = (selA, selB) => {
    if (!selA || !selB) return false;
    return selA.entityName === selB.entityName && selA.shapeIndex === selB.shapeIndex;
};

function compactJsonData(currentData, defaultData) {
    const compacted = {};
    for (const key in currentData) {
        if (Object.hasOwnProperty.call(currentData, key)) {
            const currentValue = currentData[key];
            const defaultValue = defaultData ? defaultData[key] : undefined;
            if (requiredKeys.includes(key)) {
                compacted[key] = currentValue;
                continue;
            }
            if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
                const compactedValue = compactJsonData(currentValue, defaultValue);
                if (Object.keys(compactedValue).length > 0) {
                     if (!isEqual(compactedValue, defaultValue)) compacted[key] = compactedValue;
                } else if (defaultValue && typeof defaultValue === 'object' && Object.keys(defaultValue).length === 0) {
                     if (!isEqual(compactedValue, defaultValue)) compacted[key] = compactedValue;
                }
            } else if (Array.isArray(currentValue)) {
                if (currentValue.length > 0) {
                     if (!isEqual(currentValue, defaultValue)) compacted[key] = currentValue;
                }
            } else {
                if (!isEqual(currentValue, defaultValue)) compacted[key] = currentValue;
            }
        }
    }
    return compacted;
}


export const useAppLogic = () => {
    const [activeMenu, setActiveMenu] = useState(null);
    const [jsonData, setJsonData] = useState(initialJsonData);
    const [jsonContent, setJsonContent] = useState(() => JSON.stringify(compactJsonData(initialJsonData, initialJsonData), null, 2));
    const [threeDConfig, setThreeDConfig] = useState(null);
    const [svgPlotFilename, setSvgPlotFilename] = useState(null);
    const [isPlotReady, setIsPlotReady] = useState(false);
    const [plotError, setPlotError] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [clickSelected, setClickSelected] = useState([]);
    const [clientId] = useState(() => uuidv4());
    const [activeSim, setActiveSim] = useState({ pid: null, data_channel_id: null, svg_filename: null });
    const [liveFrameData, setLiveFrameData] = useState(null);
    const socketRef = useRef(null);
    const threeDManagerRef = useRef(null);
    const frameQueueRef = useRef([]);
    const animationFrameId = useRef();
    const [simulationFrames, setSimulationFrames] = useState([]);
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayFrameIndex, setReplayFrameIndex] = useState(0);
    const [replayInterval, setReplayInterval] = useState(100);
    const replayTimerRef = useRef(null);
    const activeSimRef = useRef(activeSim);
    const [transientSwcData, setTransientSwcData] = useState(null);
    const [drawableVisibility, setDrawableVisibility] = useState({});
    // --- NEW: State to track simulation time during replay ---
    const [replaySimTime, setReplaySimTime] = useState(0);

    useEffect(() => {
        activeSimRef.current = activeSim;
    }, [activeSim]);

    const onManagerReady = useCallback((manager) => {
        threeDManagerRef.current = manager;
    }, []);

    useEffect(() => {
        const processQueue = () => {
            if (frameQueueRef.current.length > 0 && threeDManagerRef.current) {
                const frame = frameQueueRef.current.shift();
                threeDManagerRef.current.updateSceneData(frame);
            }
            animationFrameId.current = requestAnimationFrame(processQueue);
        };
        animationFrameId.current = requestAnimationFrame(processQueue);
        return () => {
            cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    const handleSimulationEnded = useCallback(() => {
        setIsSimulating(false);
        frameQueueRef.current = [];
        const currentFilename = activeSimRef.current.svg_filename;
        if (currentFilename) {
            setSvgPlotFilename(currentFilename);
            setIsPlotReady(true);
            setPlotError('');
        } else {
            setPlotError("Simulation finished, but plot filename is missing.");
            setSvgPlotFilename(null);
            setIsPlotReady(false);
        }
    }, []);

    const buildModelOnServer = useCallback(async (newJsonData) => {
        setSvgPlotFilename(null);
        setIsPlotReady(false);
        setPlotError('');

        if (activeSim.pid) {
            try {
                await fetch(`${API_BASE_URL}/reset_simulation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pid: activeSim.pid, client_id: clientId })
                });
            } catch (error) {
                console.error("Failed to reset previous simulation:", error);
            }
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        try {
            const payload = { config_data: newJsonData, client_id: clientId };
            const response = await fetch(`${API_BASE_URL}/launch_simulation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
            
            const result = await response.json();

            if (result.status === 'success') {
                setActiveSim({
                    pid: result.pid,
                    data_channel_id: result.data_channel_id,
                    svg_filename: result.svg_filename
                });

                const socket = io(API_BASE_URL, { path: '/socket.io', transports: ['websocket'] });
                socketRef.current = socket;

                socket.on('connect', () => {
                    socket.emit('join_sim_channel', { data_channel_id: result.data_channel_id });
                });
                socket.on('simulation_data', (data) => {
                    if (data?.type === 'scene_init') {
                        setThreeDConfig(data.scene);
                        const initialVisibility = {};
                        (data.scene?.drawables || []).forEach(d => {
                            initialVisibility[d.groupId] = true;
                        });
                        setDrawableVisibility(initialVisibility);
                    }
                    else if (data?.filetype === 'jardesignerDataFrame') {
                        frameQueueRef.current.push(data);
                        setSimulationFrames(prev => [...prev, data]);
                        setLiveFrameData(data);
                    } else if (data?.type === 'sim_end') handleSimulationEnded();
                });
                socket.on('disconnect', (reason) => console.log(`Socket.IO disconnected. Reason: "${reason}"`));
            } else {
                throw new Error(result.message || 'Failed to launch simulation');
            }
        } catch (err) {
            console.error("Error during model build:", err);
            setActiveSim({ pid: null, data_channel_id: null, svg_filename: null });
        }
    }, [activeSim.pid, clientId, handleSimulationEnded]);

    const updateJsonData = useCallback((newDataPart) => {
        const updatedData = { ...initialJsonData, ...jsonData, ...newDataPart };
        const compactedData = compactJsonData(updatedData, initialJsonData);
        setJsonData(updatedData);
        setJsonContent(JSON.stringify(compactedData, null, 2));
        buildModelOnServer(compactedData);
    }, [jsonData, buildModelOnServer]);
    
    const handleMorphologyFileChange = useCallback(({ filename, content }) => {
        updateJsonData({
            cellProto: {
                type: 'file',
                source: filename
            }
        });
        setTransientSwcData(content);
    }, [updateJsonData]);

    const handleStartRun = useCallback((runParams) => {
        if (!activeSim.pid || !socketRef.current?.connected) return;
        frameQueueRef.current = [];
        setSimulationFrames([]);
        setReplayFrameIndex(0);
        setIsReplaying(false);
        setIsSimulating(true);
        setThreeDConfig(null);
        socketRef.current.emit('sim_command', { command: 'start', pid: activeSim.pid, params: { runtime: runParams.runtime } });
    }, [activeSim.pid]);

    const handleResetRun = useCallback(async () => {
        setIsSimulating(false);
        if (activeSim.pid) {
            await buildModelOnServer(compactJsonData(jsonData, initialJsonData));
        }
    }, [activeSim.pid, jsonData, buildModelOnServer]);

    const handleReplayEnd = useCallback(() => {
        setIsReplaying(false);
        if (svgPlotFilename) setIsPlotReady(true);
    }, [svgPlotFilename]);

    // --- MODIFIED: handleStartReplay now resets the simulation time ---
    const handleStartReplay = useCallback(() => {
        if (simulationFrames.length === 0) return;
        setIsPlotReady(false);
        setIsReplaying(true);
        setReplayFrameIndex(0);
        setReplaySimTime(0); // Reset the clock
    }, [simulationFrames.length]);

    const handleStopReplay = useCallback(() => handleReplayEnd(), [handleReplayEnd]);

    const minVisibleDt = useMemo(() => {
        if (!threeDConfig?.drawables) return 0.001;
        let minDt = Infinity;
        threeDConfig.drawables.forEach(d => {
            if (drawableVisibility[d.groupId] && d.dt < minDt) {
                minDt = d.dt;
            }
        });
        return minDt === Infinity ? 0.001 : minDt;
    }, [threeDConfig, drawableVisibility]);

    // --- MODIFIED: Completely new, robust replay logic driven by simulation time ---
    const replayFrameIndexRef = useRef(0);
    useEffect(() => {
        replayFrameIndexRef.current = replayFrameIndex;
    }, [replayFrameIndex]);

    useEffect(() => {
        if (isReplaying) {
            replayTimerRef.current = setInterval(() => {
                setReplaySimTime(prevSimTime => {
                    const totalRuntime = jsonData.runtime || 0.3;
                    const nextSimTime = prevSimTime + minVisibleDt;

                    // End replay if we have exceeded the total runtime
                    if (prevSimTime >= totalRuntime) {
                        handleReplayEnd();
                        return prevSimTime;
                    }

                    const lastRenderedIndex = replayFrameIndexRef.current;
                    let nextFrameIndexToRender = lastRenderedIndex;

                    // Find all frames between the last render and the new target time
                    for (let i = lastRenderedIndex + 1; i < simulationFrames.length; i++) {
                        const frame = simulationFrames[i];
                        if (frame.timestamp <= nextSimTime) {
                            if (threeDManagerRef.current && drawableVisibility[frame.groupId]) {
                                threeDManagerRef.current.updateSceneData(frame);
                            }
                            nextFrameIndexToRender = i;
                        } else {
                            break; // Stop once we pass the target time
                        }
                    }
                    
                    // Update the UI frame index to the last frame we rendered in this step
                    if (nextFrameIndexToRender !== lastRenderedIndex) {
                        setReplayFrameIndex(nextFrameIndexToRender);
                    }
                    
                    return nextSimTime;
                });
            }, replayInterval);
        } else {
            clearInterval(replayTimerRef.current);
        }
        return () => clearInterval(replayTimerRef.current);
    }, [isReplaying, replayInterval, simulationFrames, handleReplayEnd, drawableVisibility, minVisibleDt, jsonData.runtime]);


    const handleSelectionChange = useCallback((selection, isCtrlClick) => {
        setClickSelected(prev => {
            if (isCtrlClick) {
                const isSelected = prev.some(item => isSameSelection(item, selection));
                return isSelected ? prev.filter(item => !isSameSelection(item, selection)) : [...prev, selection];
            }
            return (prev.length === 1 && isSameSelection(prev[0], selection)) ? [] : [selection];
        });
    }, []);
    
    const updateJsonString = useCallback((newJsonString) => {
        setJsonContent(newJsonString);
        try {
            const parsedData = JSON.parse(newJsonString);
            const mergedData = { ...initialJsonData, ...parsedData };
            const compacted = compactJsonData(mergedData, initialJsonData);
            setJsonData(mergedData);
            setJsonContent(JSON.stringify(compacted, null, 2));
            setTransientSwcData(null);
            setThreeDConfig(null);
            buildModelOnServer(compacted);
        } catch (e) {
            alert(`Failed to load model: ${e.message}`);
        }
    }, [buildModelOnServer]);

    const handleClearModel = useCallback(() => {
        const compacted = compactJsonData(initialJsonData, initialJsonData);
        setJsonData(initialJsonData);
        setJsonContent(JSON.stringify(compacted, null, 2));
        setTransientSwcData(null);
        setThreeDConfig(null);
        setSvgPlotFilename(null);
        setIsPlotReady(false);
        setPlotError('');
        buildModelOnServer(compacted);
    }, [buildModelOnServer]);

    const getCurrentJsonData = useCallback(() => compactJsonData(jsonData, initialJsonData), [jsonData]);
    
    const getChemProtos = useCallback(() => {
        return jsonData?.chemProto?.map(p => p?.name).filter(Boolean) || [];
    }, [jsonData?.chemProto]);

    const toggleMenu = (menu) => setActiveMenu(prev => (prev === menu ? null : menu));

    return {
        activeMenu, toggleMenu, jsonData, jsonContent, threeDConfig, svgPlotFilename,
        isPlotReady, plotError, isSimulating, clickSelected, activeSim, liveFrameData,
        simulationFrames, isReplaying, replayFrameIndex, replayInterval, onManagerReady,
        setReplayInterval, handleStartReplay, handleStopReplay, handleSelectionChange,
        updateJsonData, handleStartRun, handleResetRun, updateJsonString, handleClearModel,
        getCurrentJsonData, getChemProtos, setActiveMenu,
        handleMorphologyFileChange,
        drawableVisibility, setDrawableVisibility,
    };
};
