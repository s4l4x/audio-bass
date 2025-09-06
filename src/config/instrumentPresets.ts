import type { AudioGraphConfig } from '../types/audioGraph'

// Graph configuration for basic synthesizer
export const synthPreset: AudioGraphConfig = {
  name: 'Basic Synth',
  type: 'instrument',
  graph: {
    nodes: {
      synth: {
        type: 'Synth',
        trigger: true,
        settings: {
          // Default settings for basic synth
          frequency: 440,
          volume: -6,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.3,
            release: 1.0,
            sustainDuration: 1.0,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential'
          }
        }
      },
      output: {
        type: 'Output',
        settings: {}
      }
    },
    connections: [
      { from: 'synth', to: 'output' }
    ],
    trigger: 'sustained' // Synth uses triggerAttack/triggerRelease pattern
  },
  metadata: {
    category: 'synthesis',
    tags: ['basic', 'synth', 'oscillator'],
    description: 'Basic synthesizer with ADSR envelope control'
  }
}

// Graph configuration for bass kick drum  
export const bassKickPreset: AudioGraphConfig = {
  name: 'Bass Kick',
  type: 'instrument',
  graph: {
    nodes: {
      membraneSynth: {
        type: 'MembraneSynth',
        trigger: true,
        settings: {
          // Default settings for bass kick drum
          volume: -6,
          pitchDecay: 0.05,
          octaves: 10,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.001,
            decay: 0.4,
            sustain: 0.01,
            release: 1.4,
            sustainDuration: 0.1,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential'
          }
        }
      },
      recorder: {
        type: 'Recorder',
        settings: {}
      },
      output: {
        type: 'Output',
        settings: {}
      }
    },
    connections: [
      { from: 'membraneSynth', to: 'recorder' },
      { from: 'membraneSynth', to: 'output' }
    ],
    trigger: 'momentary' // Bass kick uses triggerAttackRelease pattern
  },
  metadata: {
    category: 'drums',
    tags: ['bass', 'kick', 'percussion'],
    description: 'Membrane synthesizer for bass kick drums'
  }
}

// Map of presets by legacy instrument type for easy conversion
export const instrumentPresets = {
  synth: synthPreset,
  membraneSynth: bassKickPreset
} as const

// Helper function to get preset by legacy instrument type
export function getInstrumentPreset(instrumentType: 'synth' | 'membraneSynth'): AudioGraphConfig {
  return instrumentPresets[instrumentType]
}