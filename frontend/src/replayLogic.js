import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export const useReplayLogic = ({
  simulationFrames,
  drawableVisibility,
  threeDConfig,
  totalRuntime,
  replayInterval,
  threeDManagerRef,
  onReplayEnd,
}) => {
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayTime, setReplayTime] = useState(0);
  const clockRef = useRef(0);
  const lastProcessedFrameIndexRef = useRef(-1);
  const replayTimerRef = useRef(null);

  // Step 0: Create a memoized list of frames that are currently visible, sorted by time.
  const visibleFrames = useMemo(() => {
    return simulationFrames.filter(frame => drawableVisibility[frame.groupId]);
    // The frames are already sorted as they are added in appLogic.
  }, [simulationFrames, drawableVisibility]);

  // Step 1: Identify the smallest time step among visible drawables for the clock.
  const minVisibleDt = useMemo(() => {
    if (!threeDConfig?.drawables) return 0.001;
    let minDt = Infinity;
    threeDConfig.drawables.forEach(d => {
      if (drawableVisibility[d.groupId]) {
        const dtNum = parseFloat(d.dt);
        if (!isNaN(dtNum) && dtNum > 0 && dtNum < minDt) {
          minDt = dtNum;
        }
      }
    });
    return minDt === Infinity ? 0.001 : minDt;
  }, [threeDConfig, drawableVisibility]);

  // Step 2 & 3 (Combined Logic): This effect updates the 3D scene based on the current replayTime.
  // It works whether paused or replaying.
  const updateSceneToTime = useCallback((time) => {
    if (!threeDManagerRef.current) return;
    const visibleGroupIds = new Set(visibleFrames.map(f => f.groupId));
    
    // For each visible drawable, find the latest frame at or before the given time and display it.
    visibleGroupIds.forEach(groupId => {
        let frameToDisplay = null;
        for (let i = simulationFrames.length - 1; i >= 0; i--) {
            const frame = simulationFrames[i];
            if (frame.groupId === groupId && frame.timestamp <= time) {
                frameToDisplay = frame;
                break;
            }
        }
        if (frameToDisplay) {
            threeDManagerRef.current.updateSceneData(frameToDisplay);
        }
    });
  }, [threeDManagerRef, simulationFrames, visibleFrames]);

  // Effect for seeking or pausing: updates the scene when replayTime changes while paused.
  useEffect(() => {
    if (!isReplaying) {
        updateSceneToTime(replayTime);
    }
  }, [replayTime, isReplaying, updateSceneToTime, drawableVisibility]);

  // Main playback loop effect.
  useEffect(() => {
    if (!isReplaying) {
      clearInterval(replayTimerRef.current);
      return;
    }

    // Step 3 & 4: At each timestep, advance Frame Time and display relevant frames.
    replayTimerRef.current = setInterval(() => {
      const prevClockTime = clockRef.current;
      const newClockTime = prevClockTime + minVisibleDt;

      if (newClockTime > totalRuntime) {
        setReplayTime(totalRuntime);
        clockRef.current = totalRuntime;
        setIsReplaying(false);
        if(onReplayEnd) onReplayEnd();
        return;
      }
      
      // Find all frames between the last time and the new time.
      for (let i = lastProcessedFrameIndexRef.current + 1; i < visibleFrames.length; i++) {
        const frame = visibleFrames[i];
        if (frame.timestamp <= newClockTime) {
          threeDManagerRef.current?.updateSceneData(frame);
          lastProcessedFrameIndexRef.current = i;
        } else {
          break; // Stop since frames are sorted by time.
        }
      }
      
      clockRef.current = newClockTime;
      setReplayTime(newClockTime);

    }, replayInterval);

    return () => clearInterval(replayTimerRef.current);
  }, [isReplaying, replayInterval, visibleFrames, minVisibleDt, totalRuntime, threeDManagerRef, onReplayEnd]);


  // --- Control Handlers ---

  const handleStartReplay = useCallback(() => {
    if (visibleFrames.length === 0) return;
    
    // If replay ended, rewind before starting.
    if (clockRef.current >= totalRuntime) {
        clockRef.current = 0;
        lastProcessedFrameIndexRef.current = -1;
        updateSceneToTime(0);
    }
    
    setIsReplaying(true);
  }, [totalRuntime, visibleFrames, updateSceneToTime]);

  const handlePauseReplay = useCallback(() => {
    setIsReplaying(false);
  }, []);

  const handleRewindReplay = useCallback(() => {
    setIsReplaying(false);
    clockRef.current = 0;
    lastProcessedFrameIndexRef.current = -1;
    setReplayTime(0); // This will trigger the paused-state effect to update the scene
  }, []);

  const handleSeekReplay = useCallback((time) => {
    setIsReplaying(false);
    const newTime = Math.max(0, Math.min(totalRuntime, time));
    clockRef.current = newTime;
    
    // Determine the last processed frame index for the new time.
    lastProcessedFrameIndexRef.current = visibleFrames.findLastIndex(f => f.timestamp <= newTime);

    setReplayTime(newTime);
  }, [totalRuntime, visibleFrames]);

  return {
    replayTime,
    isReplaying,
    handleStartReplay,
    handlePauseReplay,
    handleRewindReplay,
    handleSeekReplay
  };
};
