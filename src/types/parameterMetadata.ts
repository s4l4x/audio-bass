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
  // Description for info tooltip
  description?: string
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
  
  // Filter type
  filterType: {
    controlType: 'select',
    options: [
      { value: 'lowpass', label: 'Low Pass' },
      { value: 'highpass', label: 'High Pass' },
      { value: 'bandpass', label: 'Band Pass' },
      { value: 'lowshelf', label: 'Low Shelf' },
      { value: 'highshelf', label: 'High Shelf' },
      { value: 'notch', label: 'Notch' },
      { value: 'allpass', label: 'All Pass' },
      { value: 'peaking', label: 'Peaking' }
    ]
  },
  
  // MetalSynth specific parameters
  harmonicity: {
    controlType: 'slider',
    unit: '',
    range: { min: 0.1, max: 10, step: 0.1 },
    description: 'Ratio between carrier and modulator frequencies. 1.0 = same frequency (tremolo), 2.0 = octave relationship, 3.0 = perfect fifth, higher values create inharmonic/metallic sounds.'
  },
  
  modulationIndex: {
    controlType: 'slider',
    unit: '',
    range: { min: 1, max: 100, step: 1 },
    description: 'Depth of frequency modulation. 0 = no modulation, 1-5 = subtle harmonics, 10-20 = rich harmonic content, 50+ = complex bell-like/metallic timbres.'
  }
}

// Context-aware parameter metadata for instrument-specific parameters
const instrumentSpecificMetadata: Record<string, Record<string, ParameterMetadata>> = {
  MetalSynth: {
    resonance: {
      controlType: 'slider',
      unit: 'Hz',
      range: { min: 0, max: 7000, step: 50 },
      formatDisplay: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString(),
      description: 'Highpass filter cutoff frequency. Controls the brightness and metallic character. Higher values create brighter, more bell-like sounds.'
    }
  },
  
  AMSynth: {
    harmonicity: {
      controlType: 'slider',
      unit: '',
      range: { min: 0.1, max: 10, step: 0.1 },
      description: 'Amplitude modulation ratio. 1.0 creates tremolo, 2.0+ creates harmonic sidebands. Higher values produce more complex, bell-like timbres.'
    }
  },
  
  FMSynth: {
    harmonicity: {
      controlType: 'slider',
      unit: '',
      range: { min: 0.1, max: 10, step: 0.1 },
      description: 'FM carrier-to-modulator ratio. 1.0 = same frequency, integer ratios create harmonic spectra, non-integer ratios create inharmonic timbres.'
    },
    modulationIndex: {
      controlType: 'slider',
      unit: '',
      range: { min: 0, max: 100, step: 1 },
      description: 'FM synthesis depth. Controls spectral complexity. Low values (1-10) add harmonics, high values (20+) create bell-like, metallic sounds.'
    }
  },
  
  MonoSynth: {
    // Filter parameters
    Q: {
      controlType: 'slider',
      unit: '',
      range: { min: 0.1, max: 30, step: 0.1 },
      description: 'Filter resonance/Q factor. Higher values create more pronounced resonance peaks and can make the filter self-oscillate at extreme settings.'
    },
    filterType: {
      controlType: 'select',
      options: [
        { value: 'lowpass', label: 'Low Pass' },
        { value: 'highpass', label: 'High Pass' },
        { value: 'bandpass', label: 'Band Pass' },
        { value: 'notch', label: 'Notch' }
      ],
      description: 'Filter type. Lowpass cuts high frequencies above the cutoff, highpass cuts low frequencies below the cutoff, bandpass only allows frequencies near the cutoff, notch cuts frequencies at the cutoff.'
    },
    rolloff: {
      controlType: 'select',
      options: [
        { value: '-12', label: '-12 dB/oct' },
        { value: '-24', label: '-24 dB/oct' },
        { value: '-48', label: '-48 dB/oct' },
        { value: '-96', label: '-96 dB/oct' }
      ],
      description: 'Filter slope steepness. Controls how sharply the filter cuts frequencies. -12 dB/oct is gentle and musical, -96 dB/oct is very sharp and aggressive.'
    },
    
    // Filter envelope parameters
    baseFrequency: {
      controlType: 'slider',
      unit: 'Hz',
      range: { min: 20, max: 2000, step: 10 },
      description: 'Filter cutoff frequency. This is where the filter starts cutting frequencies. For lowpass: frequencies above this are cut. For highpass: frequencies below this are cut.'
    },
    octaves: {
      controlType: 'slider',
      unit: 'oct',
      range: { min: 0.1, max: 8, step: 0.1 },
      description: 'Range of the filter envelope in octaves. Higher values allow the filter to sweep across a wider frequency range.'
    },
    exponent: {
      controlType: 'slider',
      unit: '',
      range: { min: 0.1, max: 10, step: 0.1 },
      description: 'Filter envelope curve shape. 1.0 = linear, >1.0 = exponential rise, <1.0 = logarithmic rise. Affects the character of the filter sweep.'
    }
  },
  
  PluckSynth: {
    attackNoise: {
      controlType: 'slider',
      unit: '',
      range: { min: 0.1, max: 20, step: 0.1 },
      description: 'Amount of noise burst at the beginning of the pluck. Higher values create more aggressive attack transients and percussive character.'
    },
    dampening: {
      controlType: 'slider',
      unit: 'Hz',
      range: { min: 20, max: 7000, step: 50 },
      formatDisplay: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString(),
      description: 'Lowpass filter frequency of the comb filter. Lower values create darker, more muffled plucks. Higher values sound brighter and more metallic.'
    },
    resonance: {
      controlType: 'slider',
      unit: '',
      range: { min: 0.0, max: 1.0, step: 0.01 },
      description: 'Amount of resonance and sustain duration. Higher values make the pluck ring out longer with more harmonic content.'
    },
    release: {
      controlType: 'slider',
      unit: 's',
      range: { min: 0.1, max: 5.0, step: 0.1 },
      description: 'Release time for resonance ramp down. Controls how quickly the pluck fades out after being triggered.'
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
  const skipParams = ['envelope', 'oscillator', 'filter', 'filterEnvelope', 'context', 'channelCount', 'numberOfInputs', 'numberOfOutputs']
  return !skipParams.includes(parameterName)
}