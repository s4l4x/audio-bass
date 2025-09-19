import type { AudioGraphConfig } from '../types/audioGraph'

// Graph configuration for synthesizer
export const synthPreset: AudioGraphConfig = {
  name: 'Synth',
  type: 'instrument',
  graph: {
    nodes: {
      synth: {
        type: 'Synth',
        trigger: true,
        settings: {
          // Default settings for synthesizer
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

// Preset for AMSynth (Amplitude Modulation Synthesis)
export const amSynthPreset: AudioGraphConfig = {
  name: 'AM Synth',
  type: 'instrument',
  graph: {
    nodes: {
      amSynth: {
        type: 'AMSynth',
        trigger: true,
        settings: {
          frequency: 440,
          volume: -6,
          harmonicity: 3.0,
          oscillator: { type: 'sine' },
          modulation: { type: 'square', frequency: 440 },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.3,
            release: 1.0
          }
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'amSynth', to: 'output' }],
    trigger: 'sustained'
  },
  metadata: {
    category: 'synthesis',
    tags: ['am', 'modulation', 'synthesis'],
    description: 'Amplitude modulation synthesizer'
  }
}

// Preset for FMSynth (Frequency Modulation Synthesis)
export const fmSynthPreset: AudioGraphConfig = {
  name: 'FM Synth',
  type: 'instrument',
  graph: {
    nodes: {
      fmSynth: {
        type: 'FMSynth',
        trigger: true,
        settings: {
          frequency: 440,
          volume: -6,
          harmonicity: 3.0,
          modulationIndex: 10,
          oscillator: { type: 'sine' },
          modulation: { type: 'sine', frequency: 440 },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.3,
            release: 1.0
          }
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'fmSynth', to: 'output' }],
    trigger: 'sustained'
  },
  metadata: {
    category: 'synthesis',
    tags: ['fm', 'modulation', 'synthesis'],
    description: 'Frequency modulation synthesizer'
  }
}

// Preset for DuoSynth (Two oscillator synth)
export const duoSynthPreset: AudioGraphConfig = {
  name: 'Duo Synth',
  type: 'instrument',
  graph: {
    nodes: {
      duoSynth: {
        type: 'DuoSynth',
        trigger: true,
        settings: {
          frequency: 440,
          volume: -6,
          voice0: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 }
          },
          voice1: {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 }
          }
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'duoSynth', to: 'output' }],
    trigger: 'sustained'
  },
  metadata: {
    category: 'synthesis',
    tags: ['dual', 'oscillator', 'synthesis'],
    description: 'Two oscillator synthesizer'
  }
}

// Preset for MonoSynth (Monophonic synth with filter)
export const monoSynthPreset: AudioGraphConfig = {
  name: 'Mono Synth',
  type: 'instrument',
  graph: {
    nodes: {
      monoSynth: {
        type: 'MonoSynth',
        trigger: true,
        settings: {
          frequency: 440,
          volume: -6,
          // Filter parameters (flattened for UI)
          Q: 6,
          filterType: 'lowpass',
          rolloff: -24,
          // Filter envelope parameters (flattened for UI)
          baseFrequency: 200,
          octaves: 7,
          exponent: 2,
          // Nested parameters for Tone.js
          oscillator: { type: 'sawtooth' },
          filter: { Q: 6, type: 'lowpass', rolloff: -24 },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.3,
            release: 1.0
          },
          filterEnvelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.1,
            release: 0.5,
            baseFrequency: 200,
            octaves: 7,
            exponent: 2
          }
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'monoSynth', to: 'output' }],
    trigger: 'sustained'
  },
  metadata: {
    category: 'synthesis',
    tags: ['mono', 'filter', 'bass'],
    description: 'Monophonic synthesizer with filter envelope'
  }
}

// Preset for PluckSynth (Physical modeling)
export const pluckSynthPreset: AudioGraphConfig = {
  name: 'Pluck Synth',
  type: 'instrument',
  graph: {
    nodes: {
      pluckSynth: {
        type: 'PluckSynth',
        trigger: true,
        settings: {
          frequency: 440,
          volume: -6,
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.7,
          release: 1
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'pluckSynth', to: 'output' }],
    trigger: 'momentary'
  },
  metadata: {
    category: 'synthesis',
    tags: ['pluck', 'physical', 'string'],
    description: 'Physical modeling plucked string synthesizer'
  }
}

// Preset for MetalSynth (Metallic sounds)
export const metalSynthPreset: AudioGraphConfig = {
  name: 'Metal Synth',
  type: 'instrument',
  graph: {
    nodes: {
      metalSynth: {
        type: 'MetalSynth',
        trigger: true,
        settings: {
          frequency: 440,
          volume: -6,
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5,
          envelope: {
            attack: 0.001,
            decay: 1.4,
            release: 0.2,
            sustain: 0
          }
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'metalSynth', to: 'output' }],
    trigger: 'momentary'
  },
  metadata: {
    category: 'synthesis',
    tags: ['metal', 'percussion', 'bells'],
    description: 'Metallic percussion synthesizer'
  }
}

// Preset for NoiseSynth (Noise-based sounds)
export const noiseSynthPreset: AudioGraphConfig = {
  name: 'Noise Synth',
  type: 'instrument',
  graph: {
    nodes: {
      noiseSynth: {
        type: 'NoiseSynth',
        trigger: true,
        settings: {
          volume: -3,
          noise: { type: 'white' },
          envelope: {
            attack: 0.005,
            decay: 0.3,
            sustain: 0.0,
            release: 0.3
          }
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'noiseSynth', to: 'output' }],
    trigger: 'momentary'
  },
  metadata: {
    category: 'synthesis',
    tags: ['noise', 'percussion', 'drums'],
    description: 'Noise-based synthesizer for percussion'
  }
}

// Preset for PolySynth (Polyphonic synthesizer)
export const polySynthPreset: AudioGraphConfig = {
  name: 'Poly Synth',
  type: 'instrument',
  graph: {
    nodes: {
      polySynth: {
        type: 'PolySynth',
        trigger: true,
        settings: {
          frequency: 440,
          volume: -6,
          voice: {
            oscillator: { type: 'sawtooth' },
            envelope: {
              attack: 0.01,
              decay: 0.3,
              sustain: 0.3,
              release: 1.0
            }
          },
          maxPolyphony: 8
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'polySynth', to: 'output' }],
    trigger: 'sustained'
  },
  metadata: {
    category: 'synthesis',
    tags: ['poly', 'polyphonic', 'chords'],
    description: 'Polyphonic synthesizer for playing chords'
  }
}

// Preset for Sampler instrument
export const samplerPreset: AudioGraphConfig = {
  name: 'Sampler',
  type: 'instrument',
  graph: {
    nodes: {
      sampler: {
        type: 'Sampler',
        trigger: true,
        settings: {
          volume: -6,
          // Sampler requires urls parameter with audio files
          urls: {
            'C4': 'https://tonejs.github.io/audio/berklee/ahh_c4.mp3'
          }
        }
      },
      output: { type: 'Output', settings: {} }
    },
    connections: [{ from: 'sampler', to: 'output' }],
    trigger: 'momentary'
  },
  metadata: {
    category: 'sampling',
    tags: ['sampler', 'audio', 'playback'],
    description: 'Sample-based instrument player'
  }
}

// Map of presets by legacy instrument type for easy conversion
export const instrumentPresets = {
  synth: synthPreset,
  membraneSynth: bassKickPreset,
  amSynth: amSynthPreset,
  fmSynth: fmSynthPreset,
  duoSynth: duoSynthPreset,
  monoSynth: monoSynthPreset,
  pluckSynth: pluckSynthPreset,
  polySynth: polySynthPreset,
  metalSynth: metalSynthPreset,
  noiseSynth: noiseSynthPreset,
  sampler: samplerPreset
} as const

// Helper function to get preset by instrument type
export function getInstrumentPreset(instrumentType: keyof typeof instrumentPresets): AudioGraphConfig {
  return instrumentPresets[instrumentType]
}

// Get all available instrument types
export function getAvailableInstruments(): Array<{ key: keyof typeof instrumentPresets; name: string; description: string }> {
  return [
    { key: 'synth', name: 'Basic Synth', description: 'Basic synthesizer with ADSR envelope' },
    { key: 'membraneSynth', name: 'Bass Kick', description: 'Membrane synthesizer for bass kick drums' },
    { key: 'amSynth', name: 'AM Synth', description: 'Amplitude modulation synthesizer' },
    { key: 'fmSynth', name: 'FM Synth', description: 'Frequency modulation synthesizer' },
    { key: 'duoSynth', name: 'Duo Synth', description: 'Two oscillator synthesizer' },
    { key: 'monoSynth', name: 'Mono Synth', description: 'Monophonic synthesizer with filter' },
    { key: 'pluckSynth', name: 'Pluck Synth', description: 'Physical modeling plucked string' },
    { key: 'polySynth', name: 'Poly Synth', description: 'Polyphonic synthesizer for chords' },
    { key: 'metalSynth', name: 'Metal Synth', description: 'Metallic percussion synthesizer' },
    { key: 'noiseSynth', name: 'Noise Synth', description: 'Noise-based synthesizer for percussion' },
    { key: 'sampler', name: 'Sampler', description: 'Sample-based instrument player' }
  ]
}