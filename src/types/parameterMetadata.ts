// Parameter metadata for auto-generating UI controls from audio graph configs

export type ControlType = 'slider' | 'select' | 'toggle'

export interface ParameterRange {
  min: number
  max: number
  step?: number
}

export interface ParameterMetadata {
  controlType: ControlType
  unit?: string
  range?: ParameterRange
  options?: Array<{ value: string; label: string }>
  formatDisplay?: (value: number) => string
  // For logarithmic scaling (like frequency)
  scale?: 'linear' | 'logarithmic'
  // Transform functions for logarithmic sliders
  toSlider?: (value: number) => number
  fromSlider?: (sliderValue: number) => number
}

// Metadata definitions for common Tone.js parameters
export const parameterMetadata: Record<string, ParameterMetadata> = {
  // Common parameters
  volume: {
    controlType: 'slider',
    unit: 'dB',
    range: { min: -30, max: 6, step: 1 }
  },
  
  frequency: {
    controlType: 'slider',
    unit: 'Hz',
    range: { min: 0, max: 300, step: 1 }, // This is the slider range, not the actual frequency range
    scale: 'logarithmic',
    formatDisplay: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString(),
    toSlider: (frequency: number) => Math.log10(frequency / 20) * 100,
    fromSlider: (sliderValue: number) => Math.round(20 * Math.pow(10, sliderValue / 100))
  },
  
  // Oscillator parameters
  oscillatorType: {
    controlType: 'select',
    options: [
      { value: 'sine', label: 'Sine' },
      { value: 'square', label: 'Square' },
      { value: 'sawtooth', label: 'Sawtooth' },
      { value: 'triangle', label: 'Triangle' }
    ]
  },
  
  // MembraneSynth specific
  pitchDecay: {
    controlType: 'slider',
    unit: 's',
    range: { min: 0.001, max: 0.5, step: 0.001 }
  },
  
  octaves: {
    controlType: 'slider',
    unit: '',
    range: { min: 1, max: 20, step: 1 }
  },
  
  // Filter parameters
  cutoff: {
    controlType: 'slider',
    unit: 'Hz',
    range: { min: 20, max: 20000, step: 1 }
  },
  
  resonance: {
    controlType: 'slider',
    unit: '',
    range: { min: 0.1, max: 30, step: 0.1 }
  },
  
  Q: {
    controlType: 'slider',
    unit: '',
    range: { min: 0.1, max: 30, step: 0.1 }
  },
  
  // MetalSynth specific parameters
  harmonicity: {
    controlType: 'slider',
    unit: '',
    range: { min: 0.1, max: 10, step: 0.1 }
  },
  
  modulationIndex: {
    controlType: 'slider',
    unit: '',
    range: { min: 1, max: 100, step: 1 }
  }
}

// Context-aware parameter metadata for instrument-specific parameters
const instrumentSpecificMetadata: Record<string, Record<string, ParameterMetadata>> = {
  MetalSynth: {
    resonance: {
      controlType: 'slider',
      unit: 'Hz',
      range: { min: 0, max: 7000, step: 50 },
      formatDisplay: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
    }
  },
  
  AMSynth: {
    harmonicity: {
      controlType: 'slider',
      unit: '',
      range: { min: 0.1, max: 10, step: 0.1 }
    }
  },
  
  FMSynth: {
    harmonicity: {
      controlType: 'slider',
      unit: '',
      range: { min: 0.1, max: 10, step: 0.1 }
    }
  }
}

// Helper function to get metadata for a parameter with instrument context
export function getParameterMetadata(parameterName: string, instrumentType?: string): ParameterMetadata | null {
  // Check for instrument-specific metadata first
  if (instrumentType && instrumentSpecificMetadata[instrumentType]?.[parameterName]) {
    return instrumentSpecificMetadata[instrumentType][parameterName]
  }
  
  // Fall back to general metadata
  return parameterMetadata[parameterName] || null
}

// Helper function to determine if a parameter should have a UI control
export function shouldShowParameter(parameterName: string): boolean {
  // Skip nested objects like envelope (handled separately)
  // Skip internal/advanced parameters
  const skipParams = ['envelope', 'oscillator', 'context', 'channelCount', 'numberOfInputs', 'numberOfOutputs']
  return !skipParams.includes(parameterName)
}