import { Button, Alert } from '@mantine/core'
import { useState } from 'react'
import * as Tone from 'tone'

export function AudioTestButton() {
  const [isTestPlaying, setIsTestPlaying] = useState(false)
  const [audioStatus, setAudioStatus] = useState<string>('')

  const testAudio = async () => {
    try {
      setAudioStatus('Testing audio...')
      console.log('🧪 Audio test started')
      
      // Ensure audio context is running
      if (Tone.getContext().state !== 'running') {
        console.log('🔧 Starting audio context for test...')
        await Tone.start()
      }
      
      console.log('📊 Audio context state:', Tone.getContext().state)
      console.log('🔊 Destination volume:', Tone.getDestination().volume.value)
      
      // Create a simple test oscillator
      const testOsc = new Tone.Oscillator(440, 'sine').toDestination()
      testOsc.volume.value = -6
      
      console.log('🎵 Starting test oscillator at 440Hz, -6dB')
      setIsTestPlaying(true)
      testOsc.start()
      
      // Play for 1 second
      setTimeout(() => {
        console.log('⏹️ Stopping test oscillator')
        testOsc.stop()
        testOsc.dispose()
        setIsTestPlaying(false)
        setAudioStatus('Test completed! Did you hear a beep?')
        
        // Clear status after 3 seconds
        setTimeout(() => setAudioStatus(''), 3000)
      }, 1000)
      
    } catch (error) {
      console.error('❌ Audio test failed:', error)
      setAudioStatus(`Test failed: ${error}`)
      setIsTestPlaying(false)
    }
  }

  return (
    <>
      <Button
        onClick={testAudio}
        disabled={isTestPlaying}
        variant="light"
        color="blue"
        size="sm"
      >
        {isTestPlaying ? '🧪 Testing...' : '🧪 Test Audio'}
      </Button>
      
      {audioStatus && (
        <Alert color="blue" variant="light">
          {audioStatus}
        </Alert>
      )}
    </>
  )
}