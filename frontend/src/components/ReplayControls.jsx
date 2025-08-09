import React, { useContext } from 'react';
import { Box, Button, Typography, Slider, TextField, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import { ReplayContext } from './ReplayContext';

const ReplayControls = ({
    isReplaying,
    onStartReplay,
    onPauseReplay,
    onRewindReplay,
    totalRuntime,
    onSeekReplay,
    replayInterval,
    setReplayInterval,
}) => {
    // Consume replayTime directly from the context.
    const { replayTime } = useContext(ReplayContext);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" size="small" onClick={onRewindReplay} startIcon={<FastRewindIcon />}>Rewind</Button>
            <Button variant="outlined" size="small" onClick={isReplaying ? onPauseReplay : onStartReplay} startIcon={isReplaying ? <PauseIcon /> : <PlayArrowIcon />}>{isReplaying ? "Pause" : "Start"}</Button>
            <TextField size="small" label="Frame Time (s)" value={replayTime.toFixed(4)} InputProps={{ readOnly: true }} sx={{ width: '120px' }}/>
            <Box sx={{ minWidth: '280px', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption">0</Typography>
                <Slider
                    min={0}
                    max={totalRuntime}
                    step={Math.max(totalRuntime/1000, 1e-6)}
                    value={Math.min(replayTime, totalRuntime)}
                    onChangeCommitted={(e, v)=> onSeekReplay(v)}
                    aria-label="progress slider"
                    // By setting the transition to 'none', we disable the default animation,
                    // allowing the slider to snap instantly to the new value.
                    sx={{
                        '& .MuiSlider-thumb': {
                            transition: 'none',
                        },
                        '& .MuiSlider-track': {
                            transition: 'none',
                        },
                    }}
                />
                <Typography variant="caption">{totalRuntime.toFixed(2)}s</Typography>
            </Box>
            <Box sx={{ width: '250px', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>Speed</Typography>
                <Tooltip title="Playback Speed (Slower -> Faster)">
                     <Slider
                        value={replayInterval}
                        onChange={(e, newValue) => setReplayInterval(newValue)}
                        aria-labelledby="replay-speed-slider"
                        valueLabelDisplay="off" min={5} max={500} step={5} inverted
                    />
                </Tooltip>
                <Box sx={{ minWidth: '55px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px', p: '4px' }}>
                     <Typography variant="caption">{replayInterval}ms</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default ReplayControls;
