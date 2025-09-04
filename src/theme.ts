import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Oxanium, system-ui, Avenir, Helvetica, Arial, sans-serif',
  headings: { fontFamily: 'Orbitron, sans-serif' },
  other: {
    adsrColors: {
      attack: '#51cf66',
      decay: '#339af0',
      sustain: '#ffd43b',
      release: '#ff6b6b',
    },
  },
});
