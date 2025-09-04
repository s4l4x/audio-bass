import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import type { 
  InstrumentType, 
  InstrumentConfig, 
  SynthSettings, 
  MembraneSynthSettings,
  InstrumentSettings 
} from '../types/instruments'

const createInstrument = (type: InstrumentType): Tone.Synth | Tone.MembraneSynth => {
  console.log('🏭 Creating instrument:', type)
  
  try {
    switch (type) {
      case 'synth':
        const synth = new Tone.Synth()
        console.log('✅ Basic synth created successfully')
        return synth
      case 'membraneSynth':
        const membrane = new Tone.MembraneSynth()
        console.log('✅ Membrane synth created successfully')
        return membrane
      default:
        console.log('⚠️ Unknown type, falling back to basic synth')
        return new Tone.Synth()
    }
  } catch (error) {
    console.error('❌ Failed to create', type, ':', String(error).slice(0, 100))
    console.log('🔄 Falling back to basic synth')
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
        envelope: { 
          attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0, sustainDuration: 1.0,
          attackCurve: 'exponential', decayCurve: 'exponential', releaseCurve: 'exponential'
        },
        oscillatorType: 'sine'
      } as SynthSettings

    case 'membraneSynth':
      return {
        ...baseSettings,
        pitchDecay: 0.05,
        octaves: 10,
        envelope: { 
          attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, sustainDuration: 0.1,
          attackCurve: 'exponential', decayCurve: 'exponential', releaseCurve: 'exponential'
        },
        oscillatorType: 'sine'
      } as MembraneSynthSettings


    default:
      return {
        ...baseSettings,
        frequency: 440,
        envelope: { 
          attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0,
          attackCurve: 'exponential', decayCurve: 'exponential', releaseCurve: 'exponential'
        },
        oscillatorType: 'sine'
      } as SynthSettings
  }
}

const applySettingsToInstrument = (instrument: Tone.Synth | Tone.MembraneSynth, type: InstrumentType, settings: InstrumentSettings) => {
  // Apply volume
  instrument.volume.value = settings.volume

  if (type === 'synth') {
    const synthSettings = settings as SynthSettings
    const synth = instrument as Tone.Synth
    
    if ('oscillator' in synth) {
      synth.oscillator.type = synthSettings.oscillatorType
    }
    
    if ('envelope' in synth) {
      synth.envelope.attack = synthSettings.envelope.attack
      synth.envelope.decay = synthSettings.envelope.decay
      synth.envelope.sustain = synthSettings.envelope.sustain
      synth.envelope.release = synthSettings.envelope.release
      synth.envelope.attackCurve = synthSettings.envelope.attackCurve
      synth.envelope.decayCurve = synthSettings.envelope.decayCurve
      synth.envelope.releaseCurve = synthSettings.envelope.releaseCurve
    }
  }

  if (type === 'membraneSynth') {
    const membraneSettings = settings as MembraneSynthSettings
    const membraneSynth = instrument as Tone.MembraneSynth
    
    membraneSynth.pitchDecay = membraneSettings.pitchDecay
    membraneSynth.octaves = membraneSettings.octaves
    membraneSynth.oscillator.type = membraneSettings.oscillatorType
    membraneSynth.envelope.attack = membraneSettings.envelope.attack
    membraneSynth.envelope.decay = membraneSettings.envelope.decay
    membraneSynth.envelope.sustain = membraneSettings.envelope.sustain
    membraneSynth.envelope.release = membraneSettings.envelope.release
    membraneSynth.envelope.attackCurve = membraneSettings.envelope.attackCurve
    membraneSynth.envelope.decayCurve = membraneSettings.envelope.decayCurve
    membraneSynth.envelope.releaseCurve = membraneSettings.envelope.releaseCurve
  }
}

export function useInstrument(initialType: InstrumentType) {
  const [config, setConfig] = useState<InstrumentConfig>({
    type: initialType,
    name: initialType,
    settings: getDefaultSettings(initialType)
  })
  
  const [isPlaying, setIsPlaying] = useState(false)
  const instrumentRef = useRef<Tone.Synth | Tone.MembraneSynth | null>(null)
  const waveformRef = useRef<Tone.Recorder | null>(null)
  const [isGeneratingWaveform, setIsGeneratingWaveform] = useState(false)
  const lastRecordingRef = useRef<AudioBuffer | null>(null)
  const [waveformDataVersion, setWaveformDataVersion] = useState(0)

  // Helper function to calculate total ADSR duration
  const calculateADSRDuration = (envelope: ADSRSettings): number => {
    return envelope.attack + envelope.decay + envelope.sustainDuration + envelope.release
  }

  // Generic waveform generation for both instrument types
  const generateWaveform = async (type: InstrumentType, settings: InstrumentSettings) => {
    try {
      // Calculate buffer duration based on instrument type
      let bufferDuration = 1.0 // Default for membrane synth
      if (type === 'synth') {
        const synthSettings = settings as SynthSettings
        bufferDuration = calculateADSRDuration(synthSettings.envelope) + 0.1 // Add small buffer
      }
      
      const buffer = await Tone.Offline((context) => {
        if (type === 'membraneSynth') {
          const membraneSettings = settings as MembraneSynthSettings
          const synth = new Tone.MembraneSynth({
            pitchDecay: membraneSettings.pitchDecay,
            octaves: membraneSettings.octaves,
            oscillator: { type: membraneSettings.oscillatorType },
            envelope: {
              attack: membraneSettings.envelope.attack,
              decay: membraneSettings.envelope.decay,
              sustain: membraneSettings.envelope.sustain,
              release: membraneSettings.envelope.release,
              attackCurve: membraneSettings.envelope.attackCurve,
              decayCurve: membraneSettings.envelope.decayCurve,
              releaseCurve: membraneSettings.envelope.releaseCurve
            },
            volume: membraneSettings.volume
          })
          
          synth.connect(context.destination)
          synth.triggerAttackRelease('C2', '8n')
        } else if (type === 'synth') {
          const synthSettings = settings as SynthSettings
          console.log('🎛️ Creating Tone.Synth with envelope:', {
            attack: synthSettings.envelope.attack,
            decay: synthSettings.envelope.decay,
            sustain: synthSettings.envelope.sustain,
            release: synthSettings.envelope.release,
            sustainDuration: synthSettings.envelope.sustainDuration
          })
          
          const synth = new Tone.Synth({
            oscillator: { type: synthSettings.oscillatorType },
            envelope: {
              attack: synthSettings.envelope.attack,
              decay: synthSettings.envelope.decay,
              sustain: synthSettings.envelope.sustain,
              release: synthSettings.envelope.release,
              attackCurve: synthSettings.envelope.attackCurve,
              decayCurve: synthSettings.envelope.decayCurve,
              releaseCurve: synthSettings.envelope.releaseCurve
            },
            volume: synthSettings.volume
          })
          
          synth.connect(context.destination)
          // For triggerAttackRelease, the duration should only be the sustain duration
          // The attack, decay, and release are handled by the envelope itself
          const noteDuration = synthSettings.envelope.sustainDuration
          console.log('🎵 Triggering synth with frequency:', synthSettings.frequency, 'note duration:', noteDuration)
          synth.triggerAttackRelease(synthSettings.frequency, noteDuration)
        }
      }, bufferDuration)
      
      lastRecordingRef.current = buffer
      setWaveformDataVersion(prev => prev + 1)
    } catch (error) {
      console.error('Error generating waveform:', error)
    }
  }

  // Initialize instrument
  useEffect(() => {
    console.log('🔧 Initializing instrument:', config.type)
    
    // Cleanup previous instrument and waveform
    if (instrumentRef.current) {
      instrumentRef.current.dispose()
    }
    if (waveformRef.current) {
      waveformRef.current.dispose()
    }
    
    // Create new instrument
    instrumentRef.current = createInstrument(config.type)
    
    // Create waveform recorder for bass kick visualization
    if (config.type === 'membraneSynth') {
      waveformRef.current = new Tone.Recorder()
      instrumentRef.current.connect(waveformRef.current)
      console.log('🌊 Recorder connected to MembraneSynth for waveform capture')
    }
    
    // Connect to destination
    instrumentRef.current.toDestination()
    console.log('✅ Instrument created and connected to destination')
    
    applySettingsToInstrument(instrumentRef.current, config.type, config.settings)
    console.log('🎛️ Settings applied to instrument')
    
    return () => {
      if (instrumentRef.current) {
        instrumentRef.current.dispose()
      }
      if (waveformRef.current) {
        waveformRef.current.dispose()
      }
    }
  }, [config.type])

  // Apply settings changes
  useEffect(() => {
    if (instrumentRef.current) {
      applySettingsToInstrument(instrumentRef.current, config.type, config.settings)
    }
  }, [config.settings, config.type])

  // Generate initial waveform after instrument is created (separate from initialization)
  useEffect(() => {
    if (instrumentRef.current) {
      // Use a timeout to ensure we're fully initialized
      setTimeout(() => {
        generateWaveform(config.type, config.settings)
      }, 100)
    }
  }, [config.type])

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
    setConfig(prev => {
      const updatedConfig = {
        ...prev,
        settings: { ...prev.settings, ...newSettings }
      }
      
      // Generate waveform immediately for both instrument types
      setTimeout(() => {
        generateWaveform(updatedConfig.type, updatedConfig.settings)
      }, 100) // Small delay to let state update
      
      return updatedConfig
    })
  }, [])

  // Temporarily disable real-time updates to focus on basic functionality
  // const debounceTimeoutRef = useRef<NodeJS.Timeout>()

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
      // Set playing state for visual feedback
      setIsPlaying(true)
      // Just play the sound - no waveform recording since we have real-time generation
      ;(instrumentRef.current as Tone.MembraneSynth).triggerAttackRelease('C2', duration)
      // Reset playing state after a brief moment
      setTimeout(() => setIsPlaying(false), 150)
    } else {
      const frequency = note || (config.settings as SynthSettings).frequency || 440
      ;(instrumentRef.current as Tone.Synth).triggerAttackRelease(frequency, duration)
    }
  }, [config.type, config.settings])

  const getWaveformData = useCallback((): Float32Array | null => {
    if (lastRecordingRef.current) {
      const channelData = lastRecordingRef.current.getChannelData(0) // Get mono channel
      
      // Use consistent downsampling for both instrument types to show actual waveform
      // Adjust sample rate to show more detail while keeping visualization smooth
      const targetPoints = 2000 // More points to show waveform detail with ADSR
      const downsampleRate = Math.max(1, Math.floor(channelData.length / targetPoints))
      const downsampled = new Float32Array(Math.ceil(channelData.length / downsampleRate))
      
      for (let i = 0; i < downsampled.length; i++) {
        downsampled[i] = channelData[i * downsampleRate] || 0
      }
      
      return downsampled
    }
    
    return null
  }, [config.type, waveformDataVersion])

  return {
    config,
    isPlaying,
    changeInstrumentType,
    updateSettings,
    triggerAttack,
    triggerRelease,
    triggerAttackRelease,
    getWaveformData
  }
}