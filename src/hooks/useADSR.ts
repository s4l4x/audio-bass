import { useState } from 'react'

export type CurveType = 'linear' | 'exponential'

// Base ADSR settings shared by all instruments
export interface BaseADSRSettings {
  attack: number
  decay: number
  sustain: number
  release: number
  attackCurve: CurveType
  decayCurve: CurveType
  releaseCurve: CurveType
}

// Sustained instruments (synths) - no fixed sustain duration
export type SustainedADSRSettings = BaseADSRSettings

// Percussive instruments (drums) - includes sustain duration
export interface PercussiveADSRSettings extends BaseADSRSettings {
  sustainDuration: number
}

// Legacy interface for backward compatibility
export type ADSRSettings = PercussiveADSRSettings

export type InstrumentType = 'sustained' | 'percussive'

export interface UseADSROptions<T extends BaseADSRSettings = ADSRSettings> {
  instrumentType?: InstrumentType
  initialSettings?: Partial<T>
  ranges?: {
    attack?: [number, number]
    decay?: [number, number]
    sustain?: [number, number]
    sustainDuration?: [number, number]
    release?: [number, number]
  }
}

const BASE_ADSR_SETTINGS: BaseADSRSettings = {
  attack: 0.01,
  decay: 0.3,
  sustain: 0.3,
  release: 1.0,
  attackCurve: 'exponential',
  decayCurve: 'exponential', 
  releaseCurve: 'exponential'
}

const DEFAULT_SUSTAINED_SETTINGS: SustainedADSRSettings = {
  ...BASE_ADSR_SETTINGS,
  // No sustainDuration for sustained instruments
}

const DEFAULT_PERCUSSIVE_SETTINGS: PercussiveADSRSettings = {
  ...BASE_ADSR_SETTINGS,
  sustainDuration: 1.0, // Fixed duration for percussive instruments
}

// Legacy default for backward compatibility (exported for tests)
export const DEFAULT_SETTINGS: ADSRSettings = DEFAULT_PERCUSSIVE_SETTINGS

const DEFAULT_RANGES = {
  attack: [0.001, 2.0] as [number, number],
  decay: [0.001, 2.0] as [number, number],
  sustain: [0.0, 1.0] as [number, number],
  sustainDuration: [0.001, 3.0] as [number, number],
  release: [0.001, 5.0] as [number, number]
}

export function useADSR<T extends BaseADSRSettings = ADSRSettings>(options: UseADSROptions<T> = {}) {
  const { instrumentType = 'percussive', initialSettings = {}, ranges = {} } = options
  
  // Get appropriate default settings based on instrument type
  const getDefaultSettings = (): T => {
    if (instrumentType === 'sustained') {
      return { ...DEFAULT_SUSTAINED_SETTINGS, ...initialSettings } as T
    } else {
      return { ...DEFAULT_PERCUSSIVE_SETTINGS, ...initialSettings } as T
    }
  }
  
  const [settings, setSettings] = useState<T>(getDefaultSettings())

  const actualRanges = {
    ...DEFAULT_RANGES,
    ...ranges
  }

  const updateSetting = (key: keyof T, value: number | CurveType) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateSettings = (newSettings: Partial<T>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  const resetToDefaults = () => {
    setSettings(getDefaultSettings())
  }

  return {
    settings,
    ranges: actualRanges,
    updateSetting,
    updateSettings,
    resetToDefaults
  }
}