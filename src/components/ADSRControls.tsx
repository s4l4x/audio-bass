import { useADSR } from '../hooks/useADSR'
import { GraphicalADSR } from './GraphicalADSR'
import type { UseADSROptions, ADSRSettings, BaseADSRSettings, InstrumentType } from '../hooks/useADSR'

interface ADSRControlsProps<T extends BaseADSRSettings = ADSRSettings> extends UseADSROptions<T> {
  instrumentType?: InstrumentType
  onSettingsChange?: (settings: T) => void
  totalDuration?: number
}

export function ADSRControls<T extends BaseADSRSettings = ADSRSettings>({ 
  instrumentType = 'percussive',
  onSettingsChange, 
  initialSettings,
  totalDuration,
  ...adsrOptions 
}: ADSRControlsProps<T>) {
  // Use the initialSettings directly if provided, otherwise use useADSR
  const { settings: defaultSettings, ranges } = useADSR({ instrumentType, ...adsrOptions })
  const currentSettings = initialSettings ? { ...defaultSettings, ...initialSettings } : defaultSettings

  const handleGraphicalChange = (newSettings: T) => {
    onSettingsChange?.(newSettings)
  }

  const resetToDefaults = () => {
    // Create default settings based on instrument type without calling hook
    const baseSettings = {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      release: 1.0,
      attackCurve: 'exponential' as const,
      decayCurve: 'exponential' as const,
      releaseCurve: 'exponential' as const
    }
    
    const resetSettings = instrumentType === 'percussive' 
      ? { ...baseSettings, sustainDuration: 1.0 } 
      : baseSettings
      
    handleGraphicalChange(resetSettings as T)
  }

  return (
    <GraphicalADSR
      instrumentType={instrumentType}
      settings={currentSettings}
      onSettingsChange={handleGraphicalChange}
      ranges={ranges}
      totalDuration={totalDuration}
      onReset={resetToDefaults}
    />
  )
}