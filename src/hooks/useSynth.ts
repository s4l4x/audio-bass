import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'

export interface SynthSettings {
  frequency: number
  volume: number
}

export function useSynth() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [settings, setSettings] = useState<SynthSettings>({
    frequency: 440,
    volume: -12
  })
  
  const synthRef = useRef<Tone.Synth | null>(null)

  useEffect(() => {
    synthRef.current = new Tone.Synth().toDestination()
    
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose()
      }
    }
  }, [])

  const togglePlay = async () => {
    if (!synthRef.current) return

    if (Tone.getContext().state !== 'running') {
      await Tone.start()
    }

    if (isPlaying) {
      synthRef.current.triggerRelease()
      setIsPlaying(false)
    } else {
      synthRef.current.frequency.value = settings.frequency
      synthRef.current.volume.value = settings.volume
      synthRef.current.triggerAttack(settings.frequency)
      setIsPlaying(true)
    }
  }

  const updateSettings = (newSettings: Partial<SynthSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    
    if (synthRef.current && isPlaying) {
      if (newSettings.frequency !== undefined) {
        synthRef.current.frequency.value = newSettings.frequency
      }
      if (newSettings.volume !== undefined) {
        synthRef.current.volume.value = newSettings.volume
      }
    }
  }

  return {
    isPlaying,
    settings,
    togglePlay,
    updateSettings
  }
}