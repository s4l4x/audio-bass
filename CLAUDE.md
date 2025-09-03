# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Audio Bass is a web-based audio application built with React, TypeScript, and Tone.js. It provides an interactive interface for audio synthesis and manipulation using modern web technologies.

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 7 with fast HMR
- **UI Library**: Mantine 8 (components, hooks, forms, notifications)
- **Audio Engine**: Tone.js 15 for Web Audio API abstraction
- **Linting**: ESLint 9 with TypeScript support

## Development Commands

```bash
npm run dev        # Start development server with HMR
npm run build      # Build for production (TypeScript + Vite)
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

## Project Architecture

### Directory Structure
```
src/
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks (useSynth, etc.)
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
└── main.tsx       # Application entry point with providers
```

### Key Patterns

- **Custom Hooks**: Audio functionality encapsulated in hooks like `useSynth` for state management and Tone.js integration
- **MantineProvider**: Configured in main.tsx for consistent theming and components
- **Audio Context**: Properly initialized with `Tone.start()` to handle browser autoplay restrictions
- **Real-time Updates**: Slider components update Tone.js parameters in real-time during playback

### Audio Integration

- Tone.js synthesizers are created using `useRef` for persistent instances
- Audio context state is managed through custom hooks
- Proper cleanup with `synth.dispose()` in useEffect cleanup
- Use `Tone.getContext()` instead of deprecated `Tone.context`