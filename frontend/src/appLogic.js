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
    const [replayInterval, setReplayInterval] = useState(100);
    const totalRuntime = useMemo(() => jsonData.runtime || 0.3, [jsonData.runtime]);
    const [drawableVisibility, setDrawableVisibility] = useState({});
    
    const [isExploded, setIsExploded] = useState(false);
    const [explodeOffset, setExplodeOffset] = useState({ x: 0, y: 0.00005, z: 0 });
    
    const simulationEndedCallbackRef = useRef();

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
        totalRuntime,
        replayInterval,
        threeDManagerRef,
        onReplayEnd: handleReplayEnd
    });
    
    useEffect(() => {
        if (threeDManagerRef.current && threeDConfig?.drawables) {
            const drawableOrder = threeDConfig.drawables.map(d => d.groupId);
            threeDManagerRef.current.applyExplodeView(isExploded, explodeOffset, drawableOrder);
        }
    }, [isExploded, explodeOffset, threeDConfig]);

    const handleExplodeToggle = useCallback(() => {
        setIsExploded(prev => !prev);
    }, []);

    const handleExplodeOffsetChange = useCallback((axis, value) => {
        setExplodeOffset(prev => ({ ...prev, [axis]: value }));
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
        const currentFilename = activeSim.svg_filename;
        if (currentFilename) {
            // This is the correct version that builds the FULL URL.
            const plotUrl = `${API_BASE_URL}/session_file/${clientId}/${currentFilename}`;
            console.log(`[CLIENT-SIDE LOG] Simulation ended. Setting plot filename for GraphWindow to: ${plotUrl}`);
            setSvgPlotFilename(plotUrl);
            setIsPlotReady(true);
            setPlotError('');
        } else {
            setPlotError("Simulation finished, but plot filename is missing.");
            setSvgPlotFilename(null);
            setIsPlotReady(false);
        }
        handleRewindReplay();
    }, [activeSim, handleRewindReplay, clientId]);

    useEffect(() => {
        simulationEndedCallbackRef.current = handleSimulationEnded;
    }, [handleSimulationEnded]);

    useEffect(() => {
        if (!activeSim.data_channel_id) {
            return;
        }

        const socket = io(API_BASE_URL, { path: '/socket.io', transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('register_client', { clientId: clientId });
            socket.emit('join_sim_channel', { data_channel_id: activeSim.data_channel_id });
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
                if (simulationEndedCallbackRef.current) {
                    simulationEndedCallbackRef.current();
                }
            }
        });

        socket.on('disconnect', (reason) => console.log(`Socket.IO disconnected. Reason: "${reason}"`));

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };

    }, [activeSim.data_channel_id, clientId]);


    const buildModelOnServer = useCallback(async (newJsonData) => {
        setSvgPlotFilename(null);
        setIsPlotReady(false);
        setPlotError('');
        setSimulationFrames([]);
        handleRewindReplay();

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        setActiveSim({ pid: null, data_channel_id: null, svg_filename: null });
        
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
            } else {
                throw new Error(result.message || 'Failed to launch simulation');
            }
        } catch (err) {
            console.error("Error during model build:", err);
            setActiveSim({ pid: null, data_channel_id: null, svg_filename: null });
        }
    }, [clientId, handleRewindReplay]);

    const updateJsonData = useCallback((newDataPart) => {
        const updatedData = { ...initialJsonData, ...jsonData, ...newDataPart };
        const compactedData = compactJsonData(updatedData, initialJsonData);
        setJsonData(updatedData);
        setJsonContent(JSON.stringify(compactedData, null, 2));
        buildModelOnServer(compactedData);
    }, [jsonData, buildModelOnServer]);
    
    const handleMorphologyFileChange = useCallback(({ filename }) => {
        updateJsonData({
            cellProto: {
                type: 'file',
                source: filename
            }
        });
    }, [updateJsonData]);

    const handleStartRun = useCallback((runParams) => {
        if (!activeSim.pid || !socketRef.current?.connected) return;
        frameQueueRef.current = [];
        setSimulationFrames([]);
        handleRewindReplay(); 
        setIsSimulating(true);
        setThreeDConfig(null);
        socketRef.current.emit('sim_command', { command: 'start', pid: activeSim.pid, params: { runtime: runParams.runtime } });
    }, [activeSim.pid, handleRewindReplay]);

    const handleResetRun = useCallback(async () => {
        setIsSimulating(false);
        if (activeSim.pid) {
            try {
                await fetch(`${API_BASE_URL}/reset_simulation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pid: activeSim.pid, client_id: clientId })
                });
                setActiveSim({ pid: null, data_channel_id: null, svg_filename: null });
            } catch (error) {
                console.error("Failed to reset previous simulation:", error);
            }
        }
    }, [activeSim.pid, clientId]);

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
            buildModelOnServer(compacted);
        } catch (e) {
            alert(`Failed to load model: ${e.message}`);
        }
    }, [buildModelOnServer]);

    const handleClearModel = useCallback(() => {
        const compacted = compactJsonData(initialJsonData, initialJsonData);
        setJsonData(initialJsonData);
        setJsonContent(JSON.stringify(compacted, null, 2));
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
        simulationFrames, isReplaying, replayInterval, onManagerReady,
        setReplayInterval, handleStartReplay, handlePauseReplay, handleSelectionChange,
        updateJsonData, handleStartRun, handleResetRun, updateJsonString, handleClearModel,
        getCurrentJsonData, getChemProtos, setActiveMenu,
        handleMorphologyFileChange,
        drawableVisibility, setDrawableVisibility,
        replayTime,
        totalRuntime,
        handleRewindReplay,
        handleSeekReplay,
        handleStopReplay: handlePauseReplay,
        isExploded,
        explodeOffset,
        handleExplodeToggle,
        handleExplodeOffsetChange,
        clientId,
    };
};
