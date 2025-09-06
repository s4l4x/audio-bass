import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Oxanium, system-ui, Avenir, Helvetica, Arial, sans-serif',
  headings: { fontFamily: 'Major Mono Display, monospace' },
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
          width: '12px',
          height: '12px',
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
    slider: {
      thumb: {
        size: '12px',
        sizeMobile: '16px'
      }
    },
    adsr: {
      colors: {
        attack: '#51cf66',
        decay: '#339af0',
        sustain: '#ffd43b',
        release: '#ff6b6b',
      },
      thumb: {
        size: 6,
        sizeActive: 7,
        // Larger sizes for mobile touch interaction
        sizeMobile: 9,
        sizeActiveMobile: 10
      }
    },
    graphGrid: {
      stroke: {
        dark: 'var(--mantine-color-dark-4)',
        light: 'var(--mantine-color-gray-3)',
        width: '1',
        opacity: '0.6'
      },
      text: {
        dark: 'var(--mantine-color-dark-2)',
        light: 'var(--mantine-color-gray-6)'
      }
    },
  },
});
