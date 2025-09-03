import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import type { 
  InstrumentType, 
  InstrumentConfig, 
  SynthSettings, 
  MembraneSynthSettings,
  InstrumentSettings 
} from '../types/instruments'

const createInstrument = (type: InstrumentType): Tone.Synth | Tone.MembraneSynth | Tone.AMSynth | Tone.FMSynth => {
  switch (type) {
    case 'synth':
      return new Tone.Synth()
    case 'membraneSynth':
      return new Tone.MembraneSynth()
    case 'amSynth':
      return new Tone.AMSynth()
    case 'fmSynth':
      return new Tone.FMSynth()
    default:
      return new Tone.Synth()
  }
}

const getDefaultSettings = (type: InstrumentType): InstrumentSettings => {
  const baseSettings = { volume: -6 }
  
  switch (type) {
    case 'synth':
      return {
        ...baseSettings,
        frequency: 440,
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 },
        oscillatorType: 'sine'
      } as SynthSettings

    case 'membraneSynth':
      return {
        ...baseSettings,
        pitchDecay: 0.05,
        octaves: 10,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
        oscillatorType: 'sine'
      } as MembraneSynthSettings

    case 'amSynth':
    case 'fmSynth':
      return {
        ...baseSettings,
        frequency: 440,
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 },
        oscillatorType: 'sine'
      } as SynthSettings

    default:
      return {
        ...baseSettings,
        frequency: 440,
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 },
        oscillatorType: 'sine'
      } as SynthSettings
  }
}

const applySettingsToInstrument = (instrument: Tone.Synth | Tone.MembraneSynth | Tone.AMSynth | Tone.FMSynth, type: InstrumentType, settings: InstrumentSettings) => {
  // Apply volume
  instrument.volume.value = settings.volume

  if (type === 'synth' || type === 'amSynth' || type === 'fmSynth') {
    const synthSettings = settings as SynthSettings
    const synth = instrument as Tone.Synth | Tone.AMSynth | Tone.FMSynth
    
    if ('oscillator' in synth) {
      synth.oscillator.type = synthSettings.oscillatorType
    }
    
    if ('envelope' in synth) {
      Object.assign(synth.envelope, synthSettings.envelope)
    }
  }

  if (type === 'membraneSynth') {
    const membraneSettings = settings as MembraneSynthSettings
    const membraneSynth = instrument as Tone.MembraneSynth
    
    membraneSynth.pitchDecay = membraneSettings.pitchDecay
    membraneSynth.octaves = membraneSettings.octaves
    membraneSynth.oscillator.type = membraneSettings.oscillatorType
    Object.assign(membraneSynth.envelope, membraneSettings.envelope)
  }
}

export function useInstrument(initialType: InstrumentType) {
  const [config, setConfig] = useState<InstrumentConfig>({
    type: initialType,
    name: initialType,
    settings: getDefaultSettings(initialType)
  })
  
  const [isPlaying, setIsPlaying] = useState(false)
  const instrumentRef = useRef<Tone.Synth | Tone.MembraneSynth | Tone.AMSynth | Tone.FMSynth | null>(null)

  // Initialize instrument
  useEffect(() => {
    console.log('🔧 Initializing instrument:', config.type)
    
    if (instrumentRef.current) {
      instrumentRef.current.dispose()
    }
    
    instrumentRef.current = createInstrument(config.type).toDestination()
    console.log('✅ Instrument created and connected to destination')
    
    applySettingsToInstrument(instrumentRef.current, config.type, config.settings)
    console.log('🎛️ Settings applied to instrument')
    
    return () => {
      if (instrumentRef.current) {
        instrumentRef.current.dispose()
      }
    }
  }, [config.type])

  // Apply settings changes
  useEffect(() => {
    if (instrumentRef.current) {
      applySettingsToInstrument(instrumentRef.current, config.type, config.settings)
    }
  }, [config.settings, config.type])

  const changeInstrumentType = useCallback((type: InstrumentType) => {
    setConfig(prev => ({
      ...prev,
      type,
      name: type,
      settings: getDefaultSettings(type)
    }))
    setIsPlaying(false)
  }, [])

  const updateSettings = useCallback((newSettings: Partial<InstrumentSettings>) => {
    setConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }))
  }, [])

  const triggerAttack = useCallback(async (note?: string | number) => {
    console.log('🎵 triggerAttack called for:', config.type)
    
    if (!instrumentRef.current) {
      console.error('❌ No instrument reference')
      return
    }

    try {
      if (Tone.getContext().state !== 'running') {
        console.log('🔧 Starting audio context...')
        await Tone.start()
        console.log('✅ Audio context started')
      }

      if (config.type === 'membraneSynth') {
        console.log('🥁 Triggering membrane synth')
        ;(instrumentRef.current as Tone.MembraneSynth).triggerAttackRelease('C2', '8n')
      } else {
        const frequency = note || (config.settings as SynthSettings).frequency || 440
        console.log('🎹 Triggering synth at frequency Hz')
        try {
          ;(instrumentRef.current as Tone.Synth).triggerAttack(frequency)
          console.log('✅ Tone.js triggerAttack completed')
          setIsPlaying(true)
          console.log('✅ isPlaying set to TRUE')
        } catch (toneError) {
          console.error('❌ Tone.js error:', String(toneError))
          // Still set playing to true since we want the button to work
          setIsPlaying(true)
        }
      }
    } catch (error) {
      console.error('❌ Error in triggerAttack:', String(error).slice(0, 100))
    }
  }, [config.type, config.settings])

  const triggerRelease = useCallback(() => {
    console.log('⏹️ triggerRelease called for:', config.type)
    
    if (!instrumentRef.current) {
      console.error('❌ No instrument reference for release')
      return
    }

    if (config.type !== 'membraneSynth') {
      console.log('🔇 Releasing synth')
      ;(instrumentRef.current as Tone.Synth).triggerRelease()
      setIsPlaying(false)
      console.log('✅ isPlaying set to FALSE')
    } else {
      console.log('ℹ️ Membrane synth does not need release (one-shot)')
    }
  }, [config.type, isPlaying])

  const triggerAttackRelease = useCallback(async (note?: string | number, duration: string = '8n') => {
    if (!instrumentRef.current) return

    if (Tone.getContext().state !== 'running') {
      await Tone.start()
    }

    if (config.type === 'membraneSynth') {
      ;(instrumentRef.current as Tone.MembraneSynth).triggerAttackRelease('C2', duration)
    } else {
      const frequency = note || (config.settings as SynthSettings).frequency || 440
      ;(instrumentRef.current as Tone.Synth).triggerAttackRelease(frequency, duration)
    }
  }, [config.type, config.settings])

  return {
    config,
    isPlaying,
    changeInstrumentType,
    updateSettings,
    triggerAttack,
    triggerRelease,
    triggerAttackRelease
  }
}