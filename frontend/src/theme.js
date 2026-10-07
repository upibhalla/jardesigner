import { createTheme } from '@mui/material/styles';

// Theme factory — supports 'light' and 'dark' modes.
// Palette: instrument-panel dark, clear blue primary, IBM Plex type system.

// Shared with getThemeExtras() below, so non-MUI consumers (Plotly, raw SVG,
// iframe-injected CSS) that can't read theme.palette stay in sync with it.
const SURFACE_BG = { light: '#ffffff', dark: '#161B22' };

export const createAppTheme = (mode) => {
  const d = mode === 'dark';

  // Surface hierarchy
  const surface = {
    bg:        d ? SURFACE_BG.dark : SURFACE_BG.light,
    paper:     d ? SURFACE_BG.dark : SURFACE_BG.light,
    container: d ? '#1E2530' : '#E5EBF5',
    high:      d ? '#253040' : '#D8E0EE',
  };

  const appBarBg     = d ? 'hsl(222, 87%, 21%)' : '#1e79e1';
  const appBarBorder = d ? 'rgba(91,154,232,0.18)' : 'rgba(74,144,226,0.25)';

  const primary   = d ? '#4a90e2' : '#4a90e2';
  const onPrimary = d ? '#001B3A' : '#FFFFFF';
  const textPri   = d ? '#FFFFFF' : '#000000';
  const textSec   = d ? '#9AAFC4' : '#555555';
  const divider   = d ? 'rgba(91,154,232,0.15)' : 'rgba(74,144,226,0.18)';
  const outline   = d ? 'rgba(100,130,160,0.28)' : 'rgba(74,144,226,0.35)';
  const tooltip   = d ? '#192538' : '#2D3038';
  const scrollbar = d ? '#2E4060' : '#C4C6D0';

  return createTheme({
    palette: {
      mode,
      primary: {
        main:         primary,
        light:        d ? '#90CAF9' : '#76b3f0',
        dark:         d ? '#1A4A8A' : '#2171c7',
        contrastText: onPrimary,
      },
      secondary: {
        main:         d ? '#8FA8C8' : '#f5a623',
        light:        d ? '#C0D4EC' : '#f8c46a',
        dark:         d ? '#2E4060' : '#c47d0a',
        contrastText: d ? '#0D1824' : '#FFFFFF',
      },
      error: {
        main:  d ? '#FFB4AB' : '#B3261E',
        light: d ? '#FFDAD6' : '#F9DEDC',
        dark:  d ? '#690005' : '#8C1D18',
      },
      warning: { main: d ? '#FFB870' : '#f5a623' },
      success: { main: d ? '#83CFA7' : '#146C3C' },
      background: { default: surface.bg, paper: surface.paper },
      text: { primary: textPri, secondary: textSec, disabled: d ? '#8D9199' : '#74777F' },
      divider,
      action: {
        hover:              d ? 'rgba(91,154,232,0.07)' : 'rgba(74,144,226,0.06)',
        selected:           d ? 'rgba(91,154,232,0.12)' : 'rgba(74,144,226,0.10)',
        focus:              d ? 'rgba(91,154,232,0.12)' : 'rgba(74,144,226,0.10)',
        disabled:           d ? 'rgba(200,214,232,0.38)' : 'rgba(26,28,30,0.38)',
        disabledBackground: d ? 'rgba(200,214,232,0.12)' : 'rgba(26,28,30,0.12)',
      },
    },

    shape: { borderRadius: 12 },

    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      // h6 — section headers in every MenuBox (22 uses)
      h6: { fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '0.005em', lineHeight: 1.4 },
      // subtitle1 — bold subsection labels
      subtitle1: { fontSize: '1rem', fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1.5 },
      // subtitle2 — field group labels
      subtitle2: { fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1.5 },
      // body1 — general content (4 uses)
      body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 },
      // body2 — most common (30 uses): field descriptions, secondary text
      body2: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.55 },
      // caption — hints, info labels
      caption: { fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '0.025em', lineHeight: 1.5 },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
            scrollbarWidth: 'thin',
            scrollbarColor: `${scrollbar} transparent`,
            '&::-webkit-scrollbar': { width: 4, height: 4 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: scrollbar, borderRadius: 2 },
          },
        },
      },

      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: appBarBg,
            backgroundImage: 'none',
            borderBottom: `1px solid ${appBarBorder}`,
            color: '#FFFFFF',
          },
        },
      },

      MuiToolbar: {
        styleOverrides: { root: { minHeight: 'auto !important' } },
      },

      MuiButton: {
        defaultProps: { variant: 'contained' },
        styleOverrides: {
          root:         { borderRadius: 6 },
          sizeLarge:    { padding: '8px 20px',  fontSize: '0.9375rem' },
          sizeMedium:   { padding: '6px 16px',  fontSize: '0.875rem'  },
          sizeSmall:    { padding: '3px 10px',  fontSize: '0.8125rem' },
          outlined:     { borderColor: outline },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: outline },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: textSec },
          },
        },
      },


      MuiSelect: {
        styleOverrides: { root: { borderRadius: 8 } },
      },

      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            backgroundColor: surface.container,
            backgroundImage: 'none',
          },
        },
      },

      MuiDialogTitle: {
        styleOverrides: { root: { fontWeight: 400, padding: '24px 24px 16px' } },
      },
      MuiDialogContent: {
        styleOverrides: { root: { padding: '0 24px 24px' } },
      },
      MuiDialogActions: {
        styleOverrides: { root: { padding: '0 24px 24px', gap: 8 } },
      },

      MuiDivider: {
        styleOverrides: { root: { borderColor: divider } },
      },

      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 48 },
          indicator: { height: 3, borderRadius: '3px 3px 0 0' },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            minHeight: 48,
            letterSpacing: '0.009em',
            color: textSec,
            '&.Mui-selected': { color: primary },
          },
        },
      },

      MuiChip: {
        styleOverrides: { root: { borderRadius: 8 } },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, backgroundColor: tooltip, color: d ? '#E2E3E8' : '#FDFBFF' },
          arrow: { color: tooltip },
        },
      },

      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12 } },
      },

      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 4 } },
      },

      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: surface.container,
            backgroundImage: 'none',
            borderRadius: 12,
            '&:before': { display: 'none' },
          },
        },
      },
    },
  });
};

// Token groups for non-MUI consumers (Plotly, raw SVG, iframe-injected CSS)
// that can't read theme.palette directly, so they stay in sync with it.
export const getThemeExtras = (mode) => {
  const d = mode === 'dark';
  return {
    chart: {
      grid:     d ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
      line:     d ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.25)',
      legendBg: d ? 'rgba(22,27,34,0.85)' : 'rgba(255,255,255,0.85)',
    },
    graph: {
      labelMuted: d ? '#aaa' : '#666',
      textOnFill: d ? '#e8eaf6' : 'black',
      edgeStroke: d ? '#90a4ae' : 'black',
    },
    iframe: {
      bg:     SURFACE_BG.dark,
      text:   '#e6e6e6',
      link:   '#8ab4f8',
      border: '#3a3f4b',
      mark:   '#4a3f00',
    },
  };
};

export default createAppTheme;
