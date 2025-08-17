import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';
import isEqual from 'lodash/isEqual';
import { useReplayLogic } from './replayLogic';

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
const API_BASE_URL = `http://${window.location.hostname}:5000`;

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
    const [replayInterval, setReplayInterval] = useState(10);
    const [drawableVisibility, setDrawableVisibility] = useState({});
    
    const [explodeAxis, setExplodeAxis] = useState({ x: false, y: false, z: false });
    const [modelBboxSize, setModelBboxSize] = useState({ x: 0, y: 0, z: 0 });
    const [explodeOffset, setExplodeOffset] = useState({ x: 0, y: 0, z: 0 });

    // FIX: The total runtime is now dynamically calculated from the latest simulation frame.
    const totalRuntime = useMemo(() => {
        if (simulationFrames.length > 0) {
            // The runtime is the timestamp of the last available frame.
            return simulationFrames[simulationFrames.length - 1].timestamp;
        }
        // Fallback to the configured runtime if no frames are available.
        return jsonData.runtime || 0.3;
    }, [simulationFrames, jsonData.runtime]);

    const onManagerReady = useCallback((manager) => {
        threeDManagerRef.current = manager;
    }, []);

    const handleReplayEnd = useCallback(() => {
        if (svgPlotFilename) setIsPlotReady(true);
    }, [svgPlotFilename]);
    
    const {
        replayTime,
        isReplaying,
        handleStartReplay,
        handlePauseReplay,
        handleRewindReplay,
        handleSeekReplay
    } = useReplayLogic({
        simulationFrames,
        drawableVisibility,
        threeDConfig,
        totalRuntime, // This now passes the dynamic value to the replay logic
        replayInterval,
        threeDManagerRef,
        onReplayEnd: handleReplayEnd
    });
    
    useEffect(() => {
        const largestDim = Math.max(modelBboxSize.x, modelBboxSize.y, modelBboxSize.z) || 0;
        const offsetValue = largestDim * 0.1;
        
        setExplodeOffset({
            x: explodeAxis.x ? offsetValue : 0,
            y: explodeAxis.y ? offsetValue : 0,
            z: explodeAxis.z ? offsetValue : 0
        });
    }, [explodeAxis, modelBboxSize]);

    useEffect(() => {
        if (threeDManagerRef.current && threeDConfig?.drawables) {
            const drawableOrder = threeDConfig.drawables.map(d => d.groupId);
            const isExplodedNow = explodeOffset.x > 0 || explodeOffset.y > 0 || explodeOffset.z > 0;
            threeDManagerRef.current.applyExplodeView(isExplodedNow, explodeOffset, drawableOrder);
        }
    }, [explodeOffset, threeDConfig]);

    const handleExplodeAxisToggle = useCallback((axis) => {
        setExplodeAxis(prev => ({ ...prev, [axis]: !prev[axis] }));
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
    
    const activeSimRef = useRef(activeSim);
    useEffect(() => {
        activeSimRef.current = activeSim;
    }, [activeSim]);
    
    useEffect(() => {
        const socket = io(API_BASE_URL, { path: '/socket.io', transports: ['websocket'] });
        socketRef.current = socket;

        const onSimulationEnded = () => {
            setIsSimulating(false);
            frameQueueRef.current = [];
            const currentFilename = activeSimRef.current.svg_filename;
            if (currentFilename) {
                const plotUrl = `${API_BASE_URL}/session_file/${clientId}/${currentFilename}`;
                setSvgPlotFilename(plotUrl);
                setIsPlotReady(true);
                setPlotError('');
            } else {
                setPlotError("Simulation finished, but plot filename is missing.");
                setSvgPlotFilename(null);
                setIsPlotReady(false);
            }
        };

        socket.on('connect', () => {
            socket.emit('register_client', { clientId: clientId });
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
                setSimulationFrames(prev => [...prev, data].sort((a, b) => a.timestamp - b.timestamp));
                setLiveFrameData(data);
            } 
            else if (data?.type === 'sim_end') {
                onSimulationEnded();
            }
        });

        socket.on('disconnect', (reason) => console.log(`Socket.IO disconnected. Reason: "${reason}"`));

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [clientId]);

    useEffect(() => {
        if (threeDManagerRef.current) {
            threeDManagerRef.current.updateSelectionVisuals(clickSelected);
        }
    }, [clickSelected]);
    
    const buildModelOnServer = useCallback(async (newJsonData) => {
        setSvgPlotFilename(null);
        setIsPlotReady(false);
        setPlotError('');
        setSimulationFrames([]);
        handleRewindReplay();
        
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
                if (socketRef.current?.connected) {
                    socketRef.current.emit('join_sim_channel', { data_channel_id: result.data_channel_id });
                }
                setActiveSim({
                    pid: result.pid,
                    data_channel_id: result.data_channel_id,
                    svg_filename: result.svg_filename
                });
                lastBuiltJsonDataRef.current = newJsonData;
            } else {
                throw new Error(result.message || 'Failed to launch simulation');
            }
        } catch (err) {
            console.error("Error during model build:", err);
            setActiveSim({ pid: null, data_channel_id: null, svg_filename: null });
        }
    }, [clientId, handleRewindReplay]);
    
    const lastBuiltJsonDataRef = useRef(null);
    const updateJsonData = useCallback((newDataPart) => {
        const updatedData = { ...initialJsonData, ...jsonData, ...newDataPart };
        const compactedData = compactJsonData(updatedData, initialJsonData);
        setJsonData(updatedData);
        setJsonContent(JSON.stringify(compactedData, null, 2));

        if (!isEqual(compactedData, lastBuiltJsonDataRef.current)) {
            buildModelOnServer(compactedData);
        }
    }, [jsonData, buildModelOnServer]);
    
    const setRunParameters = useCallback((runParams) => {
        const updatedData = { ...jsonData, ...runParams };
        setJsonData(updatedData);
        const compactedData = compactJsonData(updatedData, initialJsonData);
        setJsonContent(JSON.stringify(compactedData, null, 2));
    }, [jsonData]);

    const handleMorphologyFileChange = useCallback(({ filename }) => {
        updateJsonData({
            cellProto: {
                type: 'file',
                source: filename
            }
        });
    }, [updateJsonData]);

    const handleStartRun = useCallback(() => {
        if (!activeSim.pid || !socketRef.current?.connected) return;
        
        setSvgPlotFilename(null);
        setIsPlotReady(false);
        setPlotError('');

        if (simulationFrames.length === 0) {
            setThreeDConfig(null);
            handleRewindReplay();
        } else {
            frameQueueRef.current = [];
        }
        
        setIsSimulating(true);
        socketRef.current.emit('sim_command', { command: 'start', pid: activeSim.pid, params: { runtime: jsonData.runtime } });
    }, [activeSim.pid, jsonData.runtime, simulationFrames.length, handleRewindReplay]);

    const handleResetRun = useCallback(async () => {
        setIsSimulating(false);
        setSimulationFrames([]);
        setThreeDConfig(null);
        setSvgPlotFilename(null);
        setIsPlotReady(false);
        setPlotError('');
        handleRewindReplay();

        if (activeSim.pid) {
            try {
                await fetch(`${API_BASE_URL}/reset_simulation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pid: activeSim.pid, client_id: clientId })
                });
                setActiveSim({ pid: null, data_channel_id: null, svg_filename: null });
                lastBuiltJsonDataRef.current = null;
            } catch (error) {
                console.error("Failed to reset previous simulation:", error);
            }
        }
    }, [activeSim.pid, clientId, handleRewindReplay]);

    const handleSelectionChange = useCallback((selection, isCtrlClick) => {
        setClickSelected(prev => {
            const isSelected = prev.some(item => isSameSelection(item, selection));
            if (isCtrlClick) {
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
            updateJsonData(mergedData);
        } catch (e) {
            alert(`Failed to load model: ${e.message}`);
        }
    }, [updateJsonData]);

    const handleClearModel = useCallback(() => {
        const compacted = compactJsonData(initialJsonData, initialJsonData);
        setJsonData(initialJsonData);
        setJsonContent(JSON.stringify(compacted, null, 2));
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
        simulationFrames, isReplaying, replayInterval, onManagerReady,
        setReplayInterval, handleSelectionChange,
        updateJsonData, 
        setRunParameters,
        handleStartRun, handleResetRun, updateJsonString, handleClearModel,
        getCurrentJsonData, getChemProtos, setActiveMenu,
        handleMorphologyFileChange,
        drawableVisibility, setDrawableVisibility,
        replayTime,
        totalRuntime,
        handleStartReplay,
        handlePauseReplay,
        handleRewindReplay,
        handleSeekReplay,
        explodeAxis,
        handleExplodeAxisToggle,
        onSceneBuilt: setModelBboxSize,
        clientId,
    };
};
