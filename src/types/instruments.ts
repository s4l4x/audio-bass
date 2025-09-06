// Note: Tone types are now loaded dynamically to prevent AudioContext warnings
import type { ADSRSettings, SustainedADSRSettings } from '../hooks/useADSR'

export type InstrumentType = 'synth' | 'membraneSynth'

export interface BaseInstrumentSettings {
  volume: number
}

export interface SynthSettings extends BaseInstrumentSettings {
  frequency: number
  envelope: SustainedADSRSettings
  oscillatorType: 'sine' | 'square' | 'sawtooth' | 'triangle'
}

export interface MembraneSynthSettings extends BaseInstrumentSettings {
  pitchDecay: number
  octaves: number
  envelope: ADSRSettings
  oscillatorType: 'sine' | 'square' | 'sawtooth' | 'triangle'
}

export type InstrumentSettings = SynthSettings | MembraneSynthSettings

export interface InstrumentConfig<T extends InstrumentSettings = InstrumentSettings> {
  type: InstrumentType
  name: string
  settings: T
  instrument?: unknown // Tone.Synth | Tone.MembraneSynth | Tone.AMSynth | Tone.FMSynth
}