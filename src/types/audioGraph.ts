// Audio graph type definitions for the modular synthesis system

// Basic node types supported by the graph system
export type AudioNodeType = 
  | 'Synth'
  | 'MembraneSynth'
  | 'AMSynth'
  | 'FMSynth'
  | 'DuoSynth'
  | 'MonoSynth'
  | 'PluckSynth'
  | 'PolySynth'
  | 'Oscillator'
  | 'LFO'
  | 'Filter'
  | 'ADSR'
  | 'Multiply'
  | 'Add'
  | 'Gain'
  | 'Delay'
  | 'Reverb'
  | 'Distortion'
  | 'Chorus'
  | 'PingPongDelay'
  | 'AutoFilter'
  | 'AutoPanner'
  | 'AutoWah'
  | 'BitCrusher'
  | 'Chebyshev'
  | 'FeedbackDelay'
  | 'Freeverb'
  | 'JCReverb'
  | 'Phaser'
  | 'Tremolo'
  | 'Vibrato'
  | 'Output'
  | 'Recorder'

// Signal types for type safety
export type SignalType = 'audio' | 'cv' // cv = control voltage

// Node definition in configuration
export interface AudioNodeDefinition {
  type: AudioNodeType
  settings?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  trigger?: boolean // Mark as a trigger node (for instruments)
  inputs?: string[] // Expected input connection points
  outputs?: string[] // Available output connection points
  signalType?: SignalType
}

// Connection between nodes
export interface AudioConnection {
  from: string // source node:output format (e.g., "osc1.output" or just "osc1" for default)
  to: string   // destination node:input format (e.g., "filter.input" or just "filter" for default)
  signalType?: SignalType
}

// Modulation route
export interface ModulationRoute {
  source: string // CV source node:output
  destination: string // parameter path like "filter.cutoff"
  amount: number // modulation amount/depth
  scale?: [number, number] // scale range for modulation
}

// Graph definition
export interface AudioGraphDefinition {
  nodes: Record<string, AudioNodeDefinition>
  connections: AudioConnection[]
  modulation?: ModulationRoute[]
  trigger: 'momentary' | 'sustained' // How the graph responds to triggers
}

// Complete graph configuration
export interface AudioGraphConfig {
  name: string
  type: 'instrument' | 'effect' | 'utility'
  graph: AudioGraphDefinition
  metadata?: {
    category?: string
    tags?: string[]
    description?: string
  }
}

// Runtime node instance
export interface NodeInstance {
  id: string
  type: AudioNodeType
  instance: any // eslint-disable-line @typescript-eslint/no-explicit-any
  settings: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  inputs: Map<string, string> // Input connections (maps port to source node ID)
  outputs: Map<string, string> // Output connections (maps port to dest node ID)
  waveformData?: Float32Array // For visualization
  isDisposed: boolean
}

// Graph runtime state
export interface AudioGraphState {
  nodes: Map<string, NodeInstance>
  connections: AudioConnection[]
  isInitialized: boolean
}

// Preset configurations for easy instrument creation
export interface GraphPreset extends AudioGraphConfig {
  presetId: string
  version: string
}

// Legacy compatibility types (to be phased out)
export type LegacyInstrumentType = 'synth' | 'membraneSynth'

// Helper type for backward compatibility with legacy instrument system
export interface LegacyInstrumentConfig {
  type: LegacyInstrumentType
  name: string
  settings: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Conversion utilities between legacy and graph configs
export interface GraphConfigConverter {
  legacyToGraph: (legacy: LegacyInstrumentConfig) => AudioGraphConfig
  graphToLegacy: (graph: AudioGraphConfig) => LegacyInstrumentConfig | null
}