# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Audio Bass is a web-based audio application built with React, TypeScript, and Tone.js. It provides an interactive interface for audio synthesis and manipulation using modern web technologies.

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 7 with fast HMR
- **UI Library**: Mantine 8 (components, hooks, forms, notifications)
- **Audio Engine**: Tone.js 15 for Web Audio API abstraction
- **State Management**: XState for state machine architecture (future)
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
├── hooks/         # Custom React hooks (useAudioGraph, useADSR, etc.)
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
└── main.tsx       # Application entry point with providers
```

### Key Patterns

- **Custom Hooks**: Audio functionality encapsulated in hooks like `useAudioGraph` for state management and Tone.js integration
- **MantineProvider**: Configured in main.tsx for consistent theming and components
- **Audio Context**: Properly initialized with `Tone.start()` to handle browser autoplay restrictions
- **Real-time Updates**: Slider components update Tone.js parameters in real-time during playback
- **State Machines** (future): Business logic decoupled from React via XState machines
- **Actor Model** (future): Audio nodes as independent actors for complex routing

### Audio Integration

- Tone.js synthesizers are created using `useRef` for persistent instances
- Audio context state is managed through custom hooks
- Proper cleanup with `synth.dispose()` in useEffect cleanup
- Use `Tone.getContext()` instead of deprecated `Tone.context`

## Future Architecture: Audio Graph System

### Vision

Build a modular audio workstation supporting all Tone.js instruments through configurable graphs, with professional-grade flexibility like Vital/Serum/Reaktor.

### Current State Analysis

- Previous legacy hooks have been replaced by the audio graph system
- Need to support 20+ Tone.js instruments with complex routing (modulation, parallel processing, feedback loops)

### ✅ Phase 1: Foundation & Cleanup (COMPLETED)

1. ✅ **Remove legacy code**: Completed - removed `useInstrument.ts` and `useSynth.ts`
2. ✅ **Preserve current functionality**: Existing Synth/MembraneSynth working via audio graph system
3. ✅ **Create core graph infrastructure**:
   ```typescript
   useAudioGraph(config) // Main graph engine ✅ Implemented
   ├── useAudioNodes(nodeDefinitions) // Tone.js component management ✅ Implemented
   ├── useGraphConnections(connections) // Signal routing ✅ Implemented
   └── useModulationMatrix(routings) // Parameter modulation ✅ Implemented
   ```

**Phase 1 Status**: All objectives completed. The application successfully uses the new audio graph system for both instruments with full functionality preservation.

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

### Phase 4: State Machine Architecture (Ultimate)

Complete architectural evolution to XState-based state machines for ultimate separation of concerns:

1. **Audio Node State Machines**: Each Tone.js component as independent state machine
   - States: idle → initializing → ready → playing → disposing
   - Events: initialize, updateSettings, trigger, release, dispose  
   - Context: Tone.js instance, settings, connections
   - Actions: Pure functions that interact with Tone.js

2. **Audio Graph Orchestrator Machine**: Main coordinator managing node actors
   - Spawns and manages child node machines
   - Handles connections and signal routing
   - Coordinates global operations (trigger, release)

3. **React as Pure View Layer**: Components become pure functions of state
   - No useEffect hooks - all side effects in machines
   - No business logic - just rendering and event dispatching
   - Subscribes to machine state via integration hooks

4. **Actor Model for Complex Routing**: Perfect for modular synthesis
   - Each node is independent actor
   - Communication through parent graph machine
   - Supports complex feedback loops and parallel processing

Example state machine integration:
```typescript
// Audio node machine
const audioNodeMachine = createMachine({
  id: 'audioNode',
  initial: 'idle',
  context: { instance: null, settings: {}, nodeType: 'Synth' },
  states: {
    idle: { on: { INITIALIZE: { target: 'initializing', actions: 'createToneInstance' } } },
    ready: { 
      on: { 
        UPDATE_SETTINGS: { actions: 'updateNodeSettings' },
        TRIGGER: { target: 'playing', actions: 'triggerAttack' }
      }
    },
    playing: { on: { RELEASE: { target: 'ready', actions: 'triggerRelease' } } }
  }
})

// Pure React component
function NodeView({ nodeId, nodeState, onUpdate }) {
  return (
    <EditableValue
      value={nodeState.context.settings.frequency}
      onValueChange={(freq) => onUpdate({ frequency: freq })}
    />
  )
}
```

**Benefits:**
- **Complete Decoupling**: React purely renders, machines handle all logic
- **Predictable State**: All changes through explicit events
- **Testable Architecture**: Test machines in isolation from UI
- **Visual Debugging**: State machines are self-documenting
- **Professional Flexibility**: Actor model supports complex audio routing

### Architecture Principles

- **Configuration-driven**: Instruments defined by graph configs, not hardcoded
- **Modular**: Each audio component is composable and reusable
- **SOTA flexibility**: Support complex routing like professional synthesizers
- **Backward compatible**: Don't break existing functionality during migration

### Success Criteria

**Phase 1 & 2 (Graph System):**
- Support any Tone.js instrument without code changes
- Enable complex modulation routing (LFO → filter cutoff, etc.)
- Maintain current EditableValue components and UI patterns
- Provide foundation for pro-level synthesis capabilities

**Phase 4 (State Machine Architecture):**
- Complete separation of React rendering from business logic
- Predictable state management through explicit events
- Testable architecture with isolated business logic
- Visual debugging through state machine diagrams
- Professional-grade flexibility for complex audio routing
- Zero useEffect hooks in components (all side effects in machines)
- Hot-swappable node architecture for real-time changes

## Implementation Examples

### State Machine Architecture (Phase 4)

#### Audio Node State Machine
```typescript
// machines/audioNodeMachine.ts
import { createMachine, assign } from 'xstate'
import * as Tone from 'tone'

const audioNodeMachine = createMachine({
  id: 'audioNode',
  initial: 'idle',
  context: {
    instance: null,
    settings: {},
    connections: new Map(),
    nodeType: 'Synth',
    nodeId: ''
  },
  states: {
    idle: {
      on: {
        INITIALIZE: {
          target: 'initializing',
          actions: assign({
            nodeId: (_, event) => event.nodeId,
            nodeType: (_, event) => event.nodeType,
            settings: (_, event) => event.settings || {}
          })
        }
      }
    },
    initializing: {
      invoke: {
        src: 'createToneInstance',
        onDone: {
          target: 'ready',
          actions: assign({
            instance: (_, event) => event.data
          })
        },
        onError: 'error'
      }
    },
    ready: {
      on: {
        UPDATE_SETTINGS: {
          actions: ['updateNodeSettings', 'applySettingsToInstance']
        },
        TRIGGER: {
          target: 'playing',
          actions: 'triggerAttack'
        },
        CONNECT: {
          actions: 'addConnection'
        },
        DISCONNECT: {
          actions: 'removeConnection'
        },
        DISPOSE: 'disposing'
      }
    },
    playing: {
      on: {
        RELEASE: {
          target: 'ready',
          actions: 'triggerRelease'
        },
        UPDATE_SETTINGS: {
          actions: ['updateNodeSettings', 'applySettingsToInstance']
        }
      }
    },
    disposing: {
      invoke: {
        src: 'disposeNode',
        onDone: 'disposed'
      }
    },
    disposed: {
      type: 'final'
    },
    error: {
      on: {
        RETRY: 'idle',
        DISPOSE: 'disposed'
      }
    }
  }
}, {
  services: {
    createToneInstance: async (context) => {
      const { nodeType, settings } = context
      switch (nodeType) {
        case 'Synth': return new Tone.Synth(settings)
        case 'MembraneSynth': return new Tone.MembraneSynth(settings)
        case 'Filter': return new Tone.Filter(settings)
        case 'LFO': return new Tone.LFO(settings)
        default: throw new Error(`Unknown node type: ${nodeType}`)
      }
    },
    disposeNode: async (context) => {
      if (context.instance && context.instance.dispose) {
        context.instance.dispose()
      }
    }
  },
  actions: {
    updateNodeSettings: assign({
      settings: (context, event) => ({ ...context.settings, ...event.settings })
    }),
    applySettingsToInstance: (context) => {
      const { instance, settings } = context
      if (instance) {
        Object.entries(settings).forEach(([key, value]) => {
          if (instance[key] && typeof instance[key] === 'object' && 'value' in instance[key]) {
            instance[key].value = value
          }
        })
      }
    },
    triggerAttack: (context, event) => {
      const { instance } = context
      if (instance && 'triggerAttack' in instance) {
        instance.triggerAttack(event.note || 440)
      }
    },
    triggerRelease: (context) => {
      const { instance } = context
      if (instance && 'triggerRelease' in instance) {
        instance.triggerRelease()
      }
    }
  }
})
```

#### Audio Graph Orchestrator Machine
```typescript
// machines/audioGraphMachine.ts
import { createMachine, spawn, assign } from 'xstate'
import { audioNodeMachine } from './audioNodeMachine'

const audioGraphMachine = createMachine({
  id: 'audioGraph',
  initial: 'idle',
  context: {
    config: null,
    nodeActors: new Map(),
    connections: [],
    isPlaying: false
  },
  states: {
    idle: {
      on: {
        LOAD_CONFIG: {
          target: 'initializing',
          actions: assign({
            config: (_, event) => event.config
          })
        }
      }
    },
    initializing: {
      invoke: {
        src: 'initializeGraph',
        onDone: 'ready',
        onError: 'error'
      }
    },
    ready: {
      on: {
        TRIGGER: {
          target: 'playing',
          actions: ['triggerGraph', assign({ isPlaying: true })]
        },
        UPDATE_NODE: {
          actions: 'forwardToNode'
        },
        ADD_CONNECTION: {
          actions: 'createConnection'
        },
        REMOVE_CONNECTION: {
          actions: 'removeConnection'
        },
        RELOAD_CONFIG: {
          target: 'initializing',
          actions: assign({
            config: (_, event) => event.config
          })
        }
      }
    },
    playing: {
      on: {
        RELEASE: {
          target: 'ready',
          actions: ['releaseGraph', assign({ isPlaying: false })]
        },
        UPDATE_NODE: {
          actions: 'forwardToNode'
        }
      }
    },
    error: {
      on: {
        RETRY: 'idle',
        LOAD_CONFIG: {
          target: 'initializing',
          actions: assign({
            config: (_, event) => event.config
          })
        }
      }
    }
  }
}, {
  services: {
    initializeGraph: async (context) => {
      const { config } = context
      const nodeActors = new Map()
      
      // Create all nodes
      for (const [nodeId, nodeDefinition] of Object.entries(config.graph.nodes)) {
        const nodeActor = spawn(audioNodeMachine, nodeId)
        nodeActor.send({
          type: 'INITIALIZE',
          nodeId,
          nodeType: nodeDefinition.type,
          settings: nodeDefinition.settings
        })
        nodeActors.set(nodeId, nodeActor)
      }
      
      // Wait for all nodes to be ready
      await Promise.all(
        Array.from(nodeActors.values()).map(actor => 
          new Promise(resolve => {
            const subscription = actor.subscribe(state => {
              if (state.matches('ready') || state.matches('error')) {
                subscription.unsubscribe()
                resolve(state)
              }
            })
          })
        )
      )
      
      return nodeActors
    }
  },
  actions: {
    triggerGraph: (context, event) => {
      const { config, nodeActors } = context
      const triggerNodes = Object.entries(config.graph.nodes)
        .filter(([, nodeDef]) => nodeDef.trigger)
        .map(([nodeId]) => nodeId)
      
      triggerNodes.forEach(nodeId => {
        const actor = nodeActors.get(nodeId)
        if (actor) {
          actor.send({ type: 'TRIGGER', note: event.note })
        }
      })
    },
    releaseGraph: (context) => {
      const { config, nodeActors } = context
      const triggerNodes = Object.entries(config.graph.nodes)
        .filter(([, nodeDef]) => nodeDef.trigger)
        .map(([nodeId]) => nodeId)
      
      triggerNodes.forEach(nodeId => {
        const actor = nodeActors.get(nodeId)
        if (actor) {
          actor.send('RELEASE')
        }
      })
    },
    forwardToNode: (context, event) => {
      const { nodeActors } = context
      const actor = nodeActors.get(event.nodeId)
      if (actor) {
        actor.send({
          type: 'UPDATE_SETTINGS',
          settings: event.settings
        })
      }
    }
  }
})
```

#### React Integration Hook
```typescript
// hooks/useAudioGraphMachine.ts
import { useMachine } from '@xstate/react'
import { audioGraphMachine } from '../machines/audioGraphMachine'

export function useAudioGraphMachine(initialConfig) {
  const [state, send] = useMachine(audioGraphMachine, {
    context: { config: initialConfig }
  })

  // Auto-initialize when config is provided
  useEffect(() => {
    if (initialConfig && state.matches('idle')) {
      send({ type: 'LOAD_CONFIG', config: initialConfig })
    }
  }, [initialConfig, state, send])

  // Pure view state
  const viewState = {
    isPlaying: state.context.isPlaying,
    isReady: state.matches('ready'),
    isInitializing: state.matches('initializing'),
    hasError: state.matches('error'),
    errorMessage: state.context.error,
    nodes: Array.from(state.context.nodeActors.entries())
  }

  // Pure event dispatchers
  const actions = {
    trigger: (note?: string) => send({ type: 'TRIGGER', note }),
    release: () => send('RELEASE'),
    updateNode: (nodeId: string, settings: any) => 
      send({ type: 'UPDATE_NODE', nodeId, settings }),
    addConnection: (from: string, to: string) =>
      send({ type: 'ADD_CONNECTION', from, to }),
    reloadConfig: (config: AudioGraphConfig) =>
      send({ type: 'RELOAD_CONFIG', config })
  }

  return [viewState, actions] as const
}
```

#### Pure React Components
```typescript
// components/AudioGraphView.tsx - Pure component with zero business logic
export function AudioGraphView({ config }: { config: AudioGraphConfig }) {
  const [state, actions] = useAudioGraphMachine(config)

  if (state.isInitializing) {
    return <LoadingOverlay visible>Initializing audio graph...</LoadingOverlay>
  }

  if (state.hasError) {
    return (
      <Alert color="red">
        Failed to initialize audio graph: {state.errorMessage}
        <Button onClick={() => actions.reloadConfig(config)}>Retry</Button>
      </Alert>
    )
  }

  return (
    <Stack>
      <PlayButton 
        isPlaying={state.isPlaying}
        onPlay={() => actions.trigger()}
        onStop={actions.release}
        disabled={!state.isReady}
      />
      
      <SimpleGrid cols={2}>
        {state.nodes.map(([nodeId, nodeActor]) => {
          const nodeState = nodeActor.getSnapshot()
          return (
            <NodeView
              key={nodeId}
              nodeId={nodeId}
              nodeState={nodeState}
              onUpdate={(settings) => actions.updateNode(nodeId, settings)}
            />
          )
        })}
      </SimpleGrid>
    </Stack>
  )
}

// components/NodeView.tsx - Pure component, no hooks
export function NodeView({ 
  nodeId, 
  nodeState, 
  onUpdate 
}: {
  nodeId: string
  nodeState: any
  onUpdate: (settings: any) => void
}) {
  const { context } = nodeState
  const { settings, nodeType } = context

  const isReady = nodeState.matches('ready') || nodeState.matches('playing')
  
  if (!isReady) {
    return <Card><Text>Loading {nodeId}...</Text></Card>
  }

  return (
    <Card>
      <Stack gap="sm">
        <Text size="lg" fw={500}>{nodeId}</Text>
        <Text size="sm" c="dimmed">{nodeType}</Text>
        
        {nodeType === 'Synth' && (
          <>
            <EditableValue
              label="Frequency"
              value={settings.frequency || 440}
              unit="Hz"
              onValueChange={(freq) => onUpdate({ frequency: freq })}
              min={20}
              max={20000}
            />
            <EditableValue
              label="Volume"
              value={settings.volume || -6}
              unit="dB"
              onValueChange={(vol) => onUpdate({ volume: vol })}
              min={-60}
              max={6}
            />
          </>
        )}
        
        {nodeType === 'Filter' && (
          <>
            <EditableValue
              label="Cutoff"
              value={settings.frequency || 1000}
              unit="Hz"
              onValueChange={(freq) => onUpdate({ frequency: freq })}
            />
            <EditableValue
              label="Resonance"
              value={settings.Q || 1}
              onValueChange={(q) => onUpdate({ Q: q })}
            />
          </>
        )}
      </Stack>
    </Card>
  )
}
```

#### Testing State Machines
```typescript
// __tests__/audioGraphMachine.test.ts
import { interpret } from 'xstate'
import { audioGraphMachine } from '../machines/audioGraphMachine'

describe('Audio Graph State Machine', () => {
  test('should initialize graph from config', async () => {
    const service = interpret(audioGraphMachine)
    service.start()

    const testConfig = {
      name: 'Test Synth',
      graph: {
        nodes: {
          synth1: { type: 'Synth', trigger: true, settings: { frequency: 440 } }
        },
        connections: [],
        trigger: 'momentary'
      }
    }

    service.send({ type: 'LOAD_CONFIG', config: testConfig })
    
    // Wait for initialization
    await new Promise(resolve => {
      const subscription = service.subscribe(state => {
        if (state.matches('ready')) {
          subscription.unsubscribe()
          resolve(state)
        }
      })
    })

    expect(service.state.matches('ready')).toBe(true)
    expect(service.state.context.nodeActors.size).toBe(1)
  })

  test('should trigger and release nodes', () => {
    // Test triggering logic in isolation
    const service = interpret(audioGraphMachine)
    service.start()
    
    // Setup initialized state
    // ... setup code
    
    service.send('TRIGGER')
    expect(service.state.context.isPlaying).toBe(true)
    
    service.send('RELEASE')  
    expect(service.state.context.isPlaying).toBe(false)
  })
})
- The init screen title should be DrumUNbAss
- The app is already running via `npm run dev`