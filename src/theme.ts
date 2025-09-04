import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Oxanium, system-ui, Avenir, Helvetica, Arial, sans-serif',
  headings: { fontFamily: 'Orbitron, sans-serif' },
  components: {
    Slider: {
      styles: {
        track: {
          backgroundColor: '#666',
          height: '2px',
        },
        bar: {
          backgroundColor: '#666',
          height: '2px',
        },
        thumb: {
          backgroundColor: '#888',
          border: 'none',
          width: '16px',
          height: '16px',
          '&:hover': {
            backgroundColor: '#aaa',
          },
          '&[data-dragging="true"]': {
            backgroundColor: '#999',
          },
        },
      },
    },
  },
  other: {
    adsrColors: {
      attack: '#51cf66',
      decay: '#339af0',
      sustain: '#ffd43b',
      release: '#ff6b6b',
    },
  },
});
