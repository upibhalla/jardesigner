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
const VIEW_IDS = { SETUP: 'setup', RUN: 'run' };

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
    const isStandalone = !!(window.__JARDESIGNER_SCENE_CONFIG__ && window.__JARDESIGNER_SIMULATION_FRAMES__);

    const [activeMenu, setActiveMenu] = useState(null);
    const [jsonData, setJsonData] = useState(initialJsonData);
    const [jsonContent, setJsonContent] = useState(() => JSON.stringify(compactJsonData(initialJsonData, initialJsonData), null, 2));
    
    const [svgPlotFilename, setSvgPlotFilename] = useState(null);
    const [isPlotReady, setIsPlotReady] = useState(isStandalone);
    const [plotError, setPlotError] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [clientId] = useState(() => uuidv4());
    const [activeSim, setActiveSim] = useState({ pid: null, data_channel_id: null, svg_filename: null });
    const socketRef = useRef(null);
    const frameQueueRef = useRef([]);
    const animationFrameId = useRef();
    const [replayInterval, setReplayInterval] = useState(10);
    
    // State refactored to be keyed by viewId
    const [threeDConfigs, setThreeDConfigs] = useState(() => isStandalone ? { [VIEW_IDS.SETUP]: window.__JARDESIGNER_SCENE_CONFIG__, [VIEW_IDS.RUN]: null } : { [VIEW_IDS.SETUP]: null, [VIEW_IDS.RUN]: null });
    const [simulationFrames, setSimulationFrames] = useState(() => isStandalone ? { [VIEW_IDS.SETUP]: window.__JARDESIGNER_SIMULATION_FRAMES__, [VIEW_IDS.RUN]: [] } : { [VIEW_IDS.SETUP]: [], [VIEW_IDS.RUN]: [] });
    const [liveFrameData, setLiveFrameData] = useState({ [VIEW_IDS.SETUP]: null, [VIEW_IDS.RUN]: null });
    const [clickSelected, setClickSelected] = useState({ [VIEW_IDS.SETUP]: [], [VIEW_IDS.RUN]: [] });
    const [drawableVisibility, setDrawableVisibility] = useState({ [VIEW_IDS.SETUP]: {}, [VIEW_IDS.RUN]: {} });
    const [explodeAxis, setExplodeAxis] = useState({ [VIEW_IDS.SETUP]: { x: false, y: false, z: false }, [VIEW_IDS.RUN]: { x: false, y: true, z: false } });
    const [modelBboxSize, setModelBboxSize] = useState({ [VIEW_IDS.SETUP]: { x: 0, y: 0, z: 0 }, [VIEW_IDS.RUN]: { x: 0, y: 0, z: 0 } });
    const [explodeOffset, setExplodeOffset] = useState({ [VIEW_IDS.SETUP]: { x: 0, y: 0, z: 0 }, [VIEW_IDS.RUN]: { x: 0, y: 0, z: 0 } });
    const threeDManagerRefs = useRef({ [VIEW_IDS.SETUP]: null, [VIEW_IDS.RUN]: null });

    const totalRuntime = useMemo(() => {
        const frames = simulationFrames[VIEW_IDS.RUN] || [];
        if (frames.length > 0) {
            return frames[frames.length - 1].timestamp;
        }
        return jsonData.runtime || 0.3;
    }, [simulationFrames, jsonData.runtime]);

    const onManagerReady = useCallback((viewId, manager) => {
        if (threeDManagerRefs.current) {
            threeDManagerRefs.current[viewId] = manager;
        }
    }, []);

    const handleReplayEnd = useCallback(() => {
        if (svgPlotFilename) setIsPlotReady(true);
    }, [svgPlotFilename]);
    
    const {
        replayTime, isReplaying, handleStartReplay, handlePauseReplay, handleRewindReplay, handleSeekReplay
    } = useReplayLogic({
        simulationFrames: simulationFrames[VIEW_IDS.RUN],
        drawableVisibility: drawableVisibility[VIEW_IDS.RUN],
        threeDConfig: threeDConfigs[VIEW_IDS.RUN],
        totalRuntime,
        replayInterval,
        threeDManagerRef: { current: threeDManagerRefs.current[VIEW_IDS.RUN] },
        onReplayEnd: handleReplayEnd
    });
    
    useEffect(() => {
        Object.values(VIEW_IDS).forEach(viewId => {
            const bbox = modelBboxSize[viewId];
            const axis = explodeAxis[viewId];
            if (!bbox || !axis) return;
            const largestDim = Math.max(bbox.x, bbox.y, bbox.z) || 0;
            const offsetValue = largestDim * 0.1;
            setExplodeOffset(prev => ({ ...prev, [viewId]: {
                x: axis.x ? offsetValue : 0, y: axis.y ? offsetValue : 0, z: axis.z ? offsetValue : 0
            }}));
        });
    }, [explodeAxis, modelBboxSize]);

    useEffect(() => {
        Object.values(VIEW_IDS).forEach(viewId => {
            const manager = threeDManagerRefs.current?.[viewId];
            const config = threeDConfigs[viewId];
            const offset = explodeOffset[viewId];
            if (manager && config?.drawables) {
                const drawableOrder = config.drawables.map(d => d.groupId);
                const isExplodedNow = offset.x > 0 || offset.y > 0 || offset.z > 0;
                manager.applyExplodeView(isExplodedNow, offset, drawableOrder);
            }
        });
    }, [explodeOffset, threeDConfigs]);

    const handleExplodeAxisToggle = useCallback((viewId, axis) => {
        setExplodeAxis(prev => ({ ...prev, [viewId]: { ...prev[viewId], [axis]: !prev[viewId][axis] } }));
    }, []);

    const onSceneBuilt = useCallback((viewId, bbox) => {
        setModelBboxSize(prev => ({ ...prev, [viewId]: bbox }));
    }, []);

    useEffect(() => {
        const processQueue = () => {
            if (frameQueueRef.current.length > 0 && threeDManagerRefs.current[VIEW_IDS.RUN]) {
                const frame = frameQueueRef.current.shift();
                threeDManagerRefs.current[VIEW_IDS.RUN].updateSceneData(frame);
            }
            animationFrameId.current = requestAnimationFrame(processQueue);
        };
        animationFrameId.current = requestAnimationFrame(processQueue);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, []);
    
    const activeSimRef = useRef(activeSim);
    useEffect(() => { activeSimRef.current = activeSim; }, [activeSim]);
    
    useEffect(() => {
        if (isStandalone) {
            if (threeDConfigs[VIEW_IDS.SETUP]) {
                const initialVisibility = {};
                (threeDConfigs[VIEW_IDS.SETUP].drawables || []).forEach(d => {
                    initialVisibility[d.groupId] = d.visible !== false;
                });
                setDrawableVisibility(prev => ({...prev, [VIEW_IDS.SETUP]: initialVisibility}));
            }
            return;
        }

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

        socket.on('connect', () => socket.emit('register_client', { clientId: clientId }));

		socket.on('simulation_data', (data) => {
   			// First, check for global messages that don't have a viewId
   			if (data?.type === 'sim_end') {
       			onSimulationEnded();
       			return; // Stop processing after handling this global event
   			}
		
   			// Now, handle view-specific messages
   			const viewId = data.viewId;
   			if (!viewId || !Object.values(VIEW_IDS).includes(viewId)) return;
		
   			if (data?.type === 'scene_init') {
       			setThreeDConfigs(prev => ({ ...prev, [viewId]: data.scene }));
       			const initialVisibility = {};
       			(data.scene?.drawables || []).forEach(d => { initialVisibility[d.groupId] = true; });
       			setDrawableVisibility(prev => ({ ...prev, [viewId]: initialVisibility }));
   			}
   			else if (data?.filetype === 'jardesignerDataFrame') {
       			//console.log(`Received DataFrame with timestamp: ${data.timestamp}`);
       			if (viewId === VIEW_IDS.RUN) frameQueueRef.current.push(data);
       			setSimulationFrames(prev => ({ ...prev, [viewId]: [...prev[viewId], data].sort((a, b) => a.timestamp - b.timestamp) }));
       			setLiveFrameData(prev => ({ ...prev, [viewId]: data }));
   			}
		});

        socket.on('disconnect', (reason) => console.log(`Socket.IO disconnected. Reason: "${reason}"`));
        return () => { socket.disconnect(); socketRef.current = null; };
    }, [clientId, isStandalone]);

    useEffect(() => {
        Object.values(VIEW_IDS).forEach(viewId => {
            const manager = threeDManagerRefs.current?.[viewId];
            if (manager) manager.updateSelectionVisuals(clickSelected[viewId]);
        });
    }, [clickSelected]);
    
    const buildModelOnServer = useCallback(async (newJsonData) => {
        setSvgPlotFilename(null); setIsPlotReady(false); setPlotError('');
        setSimulationFrames({ [VIEW_IDS.SETUP]: [], [VIEW_IDS.RUN]: [] });
        handleRewindReplay();
        try {
            const payload = { config_data: newJsonData, client_id: clientId };
            const response = await fetch(`${API_BASE_URL}/launch_simulation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
            const result = await response.json();
            if (result.status === 'success') {
                if (socketRef.current?.connected) { socketRef.current.emit('join_sim_channel', { data_channel_id: result.data_channel_id }); }
                setActiveSim({ pid: result.pid, data_channel_id: result.data_channel_id, svg_filename: result.svg_filename });
                lastBuiltJsonDataRef.current = newJsonData;
            } else { throw new Error(result.message || 'Failed to launch simulation'); }
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
        if (!isEqual(compactedData, lastBuiltJsonDataRef.current)) { buildModelOnServer(compactedData); }
    }, [jsonData, buildModelOnServer]);
    
    const setRunParameters = useCallback((runParams) => {
        const updatedData = { ...jsonData, ...runParams };
        setJsonData(updatedData);
        const compactedData = compactJsonData(updatedData, initialJsonData);
        setJsonContent(JSON.stringify(compactedData, null, 2));
    }, [jsonData]);

    const handleMorphologyFileChange = useCallback(({ filename }) => {
        updateJsonData({ cellProto: { type: 'file', source: filename } });
    }, [updateJsonData]);

    const handleStartRun = useCallback(() => {
        if (!activeSim.pid || !socketRef.current?.connected) return;
        setSvgPlotFilename(null); setIsPlotReady(false); setPlotError('');
        if (simulationFrames[VIEW_IDS.RUN].length === 0) {
            setThreeDConfigs(prev => ({ ...prev, [VIEW_IDS.RUN]: null }));
            handleRewindReplay();
        } else { frameQueueRef.current = []; }
        setIsSimulating(true);
        socketRef.current.emit('sim_command', { command: 'start', pid: activeSim.pid, params: { runtime: jsonData.runtime } });
    }, [activeSim.pid, jsonData.runtime, simulationFrames, handleRewindReplay]);

    const handleResetRun = useCallback(async () => {
        setIsSimulating(false);
        setSimulationFrames({ [VIEW_IDS.SETUP]: [], [VIEW_IDS.RUN]: [] });
        setThreeDConfigs({ [VIEW_IDS.SETUP]: null, [VIEW_IDS.RUN]: null });
        setSvgPlotFilename(null); setIsPlotReady(false); setPlotError('');
        handleRewindReplay();
        if (activeSim.pid) {
            try {
                await fetch(`${API_BASE_URL}/reset_simulation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid: activeSim.pid, client_id: clientId }) });
                setActiveSim({ pid: null, data_channel_id: null, svg_filename: null });
                lastBuiltJsonDataRef.current = null;
            } catch (error) { console.error("Failed to reset previous simulation:", error); }
        }
    }, [activeSim.pid, clientId, handleRewindReplay]);

    const handleSelectionChange = useCallback((viewId, selection, isCtrlClick) => {
        setClickSelected(prev => {
            const prevSel = prev[viewId];
            const isSelected = prevSel.some(item => isSameSelection(item, selection));
            let newSel;
            if (isCtrlClick) {
                newSel = isSelected ? prevSel.filter(item => !isSameSelection(item, selection)) : [...prevSel, selection];
            } else {
                newSel = (prevSel.length === 1 && isSameSelection(prevSel[0], selection)) ? [] : [selection];
            }
            return { ...prev, [viewId]: newSel };
        });
    }, []);
    
    const updateJsonString = useCallback((newJsonString) => {
        setJsonContent(newJsonString);
        try {
            const parsedData = JSON.parse(newJsonString);
            const mergedData = { ...initialJsonData, ...parsedData };
            updateJsonData(mergedData);
        } catch (e) { alert(`Failed to load model: ${e.message}`); }
    }, [updateJsonData]);

    const handleClearModel = useCallback(() => {
        const compacted = compactJsonData(initialJsonData, initialJsonData);
        setJsonData(initialJsonData);
        setJsonContent(JSON.stringify(compacted, null, 2));
        buildModelOnServer(compacted);
    }, [buildModelOnServer]);

    const getCurrentJsonData = useCallback(() => compactJsonData(jsonData, initialJsonData), [jsonData]);
    const getChemProtos = useCallback(() => jsonData?.chemProto?.map(p => p?.name).filter(Boolean) || [], [jsonData?.chemProto]);
    const toggleMenu = (menu) => setActiveMenu(prev => (prev === menu ? null : menu));

    // --- Compatibility Layer ---
    const baseProps = {
        activeMenu, toggleMenu, jsonData, jsonContent, svgPlotFilename,
        isPlotReady, plotError, isSimulating, activeSim, clientId,
        updateJsonData, setRunParameters, handleStartRun, handleResetRun, updateJsonString, 
        handleClearModel, getCurrentJsonData, getChemProtos, setActiveMenu, handleMorphologyFileChange,
        replayTime, totalRuntime, isReplaying, replayInterval, 
		setReplayInterval, liveFrameData,
		onStartReplay: handleStartReplay, onPauseReplay: handlePauseReplay,
        onRewindReplay: handleRewindReplay, onSeekReplay: handleSeekReplay,
        handleStartReplay, handlePauseReplay, handleRewindReplay, handleSeekReplay,
    };

    if (isStandalone) {
        return {
            ...baseProps,
            threeDConfig: threeDConfigs[VIEW_IDS.SETUP],
            simulationFrames: simulationFrames[VIEW_IDS.SETUP],
            drawableVisibility: drawableVisibility[VIEW_IDS.SETUP],
            setDrawableVisibility: (updater) => setDrawableVisibility(prev => ({ ...prev, [VIEW_IDS.SETUP]: typeof updater === 'function' ? updater(prev[VIEW_IDS.SETUP]) : updater })),
            clickSelected: clickSelected[VIEW_IDS.SETUP],
            explodeAxis: explodeAxis[VIEW_IDS.SETUP],
            handleSelectionChange: (sel, ctrl) => handleSelectionChange(VIEW_IDS.SETUP, sel, ctrl),
            onManagerReady: (manager) => onManagerReady(VIEW_IDS.SETUP, manager),
            onExplodeAxisToggle: (axis) => handleExplodeAxisToggle(VIEW_IDS.SETUP, axis),
            onSceneBuilt: (bbox) => onSceneBuilt(VIEW_IDS.SETUP, bbox),
        };
    }

    return {
        ...baseProps,
        threeDConfigs, simulationFrames, drawableVisibility, 
		setDrawableVisibility, clickSelected, explodeAxis,
        handleSelectionChange, onManagerReady, 
		onExplodeAxisToggle: handleExplodeAxisToggle, onSceneBuilt,
    };
};
