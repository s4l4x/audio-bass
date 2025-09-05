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

## Future Architecture: Audio Graph System

### Vision

Build a modular audio workstation supporting all Tone.js instruments through configurable graphs, with professional-grade flexibility like Vital/Serum/Reaktor.

### Current State Analysis

- `useInstrument.ts` - rigid implementation handling only Synth + MembraneSynth
- `useSynth.ts` - legacy code, appears unused
- Need to support 20+ Tone.js instruments with complex routing (modulation, parallel processing, feedback loops)

### Phase 1: Foundation & Cleanup (Immediate)

1. **Remove legacy code**: Delete unused `useSynth.ts`
2. **Preserve current functionality**: Keep existing Synth/MembraneSynth working
3. **Create core graph infrastructure**:
   ```typescript
   useAudioGraph(config) // Main graph engine
   ├── useAudioNodes(nodeDefinitions) // Tone.js component management
   ├── useGraphConnections(connections) // Signal routing
   └── useModulationMatrix(routings) // Parameter modulation
   ```

### Phase 2: Graph System (Next Sprint)

1. **Non-linear graph support**: Move beyond linear node chains
2. **CV/Audio separation**: Distinguish control signals from audio signals
3. **Modulation routing**: LFOs → parameters, envelopes → multiple targets
4. **Configuration system**: JSON-based instrument definitions

Example graph configuration:
```typescript
const complexSynthConfig = {
  trigger: 'momentary',
  graph: {
    // Oscillators
    mainOsc: { type: 'Oscillator', frequency: 440 },
    lfo: { type: 'LFO', frequency: 2.5 },
    
    // Modulators
    freqMod: { type: 'Multiply', inputs: ['mainOsc.frequency', 'lfo.output'] },
    
    // Effects chain
    filter: { type: 'Filter', input: 'mainOsc.output', cutoff: 1000 },
    adsr: { type: 'ADSR', input: 'filter.output' },
    
    // Output
    output: { type: 'Output', input: 'adsr.output' }
  },
  connections: [
    ['lfo.output', 'mainOsc.frequency'], // LFO modulates main oscillator frequency
    ['mainOsc.output', 'filter.input'],
    ['filter.output', 'adsr.input'],
    ['adsr.output', 'output.input']
  ]
}
```

### Phase 3: Professional Features (Future)

1. **Macro controls**: High-level parameters controlling multiple targets
2. **Hot-swappable nodes**: Change components without audio dropouts  
3. **Template system**: Preset instrument configurations
4. **Polyphony management**: Multiple voice handling
5. **Real-time analysis**: Enhanced visualization

Professional features inspired by SOTA tools:
```typescript
// Matrix modulation (Vital/Serum-style)
const modulationMatrix = {
  sources: ['LFO1', 'ENV1', 'Velocity', 'ModWheel'],
  destinations: ['Osc1.Pitch', 'Filter.Cutoff', 'Amp.Level'],
  routings: [
    { source: 'LFO1', destination: 'Filter.Cutoff', amount: 0.5 },
    { source: 'ENV1', destination: 'Amp.Level', amount: 1.0 }
  ]
}

// Macro controls (Ableton-style)
const macros = {
  'Brightness': [
    { target: 'filter.cutoff', min: 200, max: 8000 },
    { target: 'filter.resonance', min: 0.1, max: 0.8 }
  ]
}
```

### Architecture Principles

- **Configuration-driven**: Instruments defined by graph configs, not hardcoded
- **Modular**: Each audio component is composable and reusable
- **SOTA flexibility**: Support complex routing like professional synthesizers
- **Backward compatible**: Don't break existing functionality during migration

### Success Criteria

- Support any Tone.js instrument without code changes
- Enable complex modulation routing (LFO → filter cutoff, etc.)
- Maintain current EditableValue components and UI patterns
- Provide foundation for pro-level synthesis capabilities