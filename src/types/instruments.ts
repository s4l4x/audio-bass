import * as Tone from 'tone'
import type { ADSRSettings } from '../hooks/useADSR'

export type InstrumentType = 'synth' | 'membraneSynth' | 'amSynth' | 'fmSynth'

export interface BaseInstrumentSettings {
  volume: number
}

export interface SynthSettings extends BaseInstrumentSettings {
  frequency: number
  envelope: ADSRSettings
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
  instrument?: Tone.Synth | Tone.MembraneSynth | Tone.AMSynth | Tone.FMSynth
}