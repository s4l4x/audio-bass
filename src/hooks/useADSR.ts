import { useState } from 'react'

export interface ADSRSettings {
  attack: number
  decay: number
  sustain: number
  release: number
}

export interface UseADSROptions {
  initialSettings?: Partial<ADSRSettings>
  ranges?: {
    attack?: [number, number]
    decay?: [number, number]
    sustain?: [number, number]
    release?: [number, number]
  }
}

const DEFAULT_SETTINGS: ADSRSettings = {
  attack: 0.01,
  decay: 0.3,
  sustain: 0.3,
  release: 1.0
}

const DEFAULT_RANGES = {
  attack: [0.001, 2.0] as [number, number],
  decay: [0.001, 2.0] as [number, number],
  sustain: [0.0, 1.0] as [number, number],
  release: [0.001, 5.0] as [number, number]
}

export function useADSR(options: UseADSROptions = {}) {
  const { initialSettings = {}, ranges = {} } = options
  
  const [settings, setSettings] = useState<ADSRSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings
  })

  const actualRanges = {
    ...DEFAULT_RANGES,
    ...ranges
  }

  const updateSetting = (key: keyof ADSRSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateSettings = (newSettings: Partial<ADSRSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  const resetToDefaults = () => {
    setSettings({ ...DEFAULT_SETTINGS, ...initialSettings })
  }

  return {
    settings,
    ranges: actualRanges,
    updateSetting,
    updateSettings,
    resetToDefaults
  }
}