import { Menu, ActionIcon, Modal, Code } from '@mantine/core'
import { IconDots, IconBug, IconTestPipe } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import * as Tone from 'tone'
import { AppearanceControls } from './AppearanceControls'

export function DebugMenu() {
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [debugModalOpened, { open: openDebugModal, close: closeDebugModal }] = useDisclosure(false)
  const [isTestPlaying, setIsTestPlaying] = useState(false)
  const [audioStatus, setAudioStatus] = useState<string>('')

  const gatherDebugInfo = async () => {
    try {
      // Ensure audio context is started
      if (Tone.getContext().state !== 'running') {
        await Tone.start()
      }

      const context = Tone.getContext()
      const userAgent = navigator.userAgent
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
      const isChrome = /Chrome/.test(userAgent)
      const isCanary = /Chrome/.test(userAgent) && /Canary/.test(userAgent)
      
      const info = {
        browser: isCanary ? 'Chrome Canary' : isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Other',
        userAgent: userAgent.substring(0, 80) + '...',
        audioContextState: context.state,
        sampleRate: context.sampleRate,
        currentTime: context.currentTime.toFixed(3),
        baseLatency: (context as any).baseLatency || 'N/A',
        outputLatency: (context as any).outputLatency || 'N/A',
        toneVersion: Tone.version || 'Unknown',
        webAudioSupported: !!(window.AudioContext || (window as any).webkitAudioContext),
        destination: {
          channelCount: Tone.getDestination().channelCount,
          maxChannelCount: Tone.getDestination().maxChannelCount,
        }
      }

      setDebugInfo(JSON.stringify(info, null, 2))
      openDebugModal()
    } catch (error) {
      setDebugInfo(`Error gathering debug info: ${error}`)
      openDebugModal()
    }
  }

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
      <Modal 
        opened={debugModalOpened} 
        onClose={closeDebugModal} 
        title="Browser Audio Debug Information"
        size="lg"
        centered
      >
        <Code block style={{ fontSize: '12px', maxHeight: '400px', overflow: 'auto' }}>
          {debugInfo}
        </Code>
      </Modal>

      <Menu shadow="md" width={280}>
        <Menu.Target>
          <ActionIcon variant="subtle" size="lg" color="gray">
            <IconDots size={20} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Appearance</Menu.Label>
          <AppearanceControls />

          {/* <Menu.Divider /> */}

          <Menu.Label>Debug Tools</Menu.Label>
          <Menu.Item 
            leftSection={<IconBug size={16} />}
            onClick={gatherDebugInfo}
          >
            Browser Debug Info
          </Menu.Item>
          <Menu.Item 
            leftSection={<IconTestPipe size={16} />}
            onClick={testAudio}
            disabled={isTestPlaying}
          >
            {isTestPlaying ? 'Testing...' : 'Test Audio'}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {audioStatus && (
        <div style={{ 
          position: 'fixed',
          top: '70px',
          right: '20px',
          background: 'var(--mantine-color-green-light)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid var(--mantine-color-green-outline)',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          {audioStatus}
        </div>
      )}
    </>
  )
}