import { Container, Center, Select, Box, Paper, Transition } from '@mantine/core'
import { useState } from 'react'
import { useAudioGraph } from './hooks/useAudioGraph'
import { SynthControls } from './components/SynthControls'
import { BassKickControls } from './components/BassKickControls'
import { DebugMenu } from './components/DebugMenu'
import { InitializationScreen } from './components/InitializationScreen'
import { getInstrumentPreset } from './config/instrumentPresets'
import { loadTone } from './utils/toneLoader'
import type { SynthSettings, MembraneSynthSettings } from './types/instruments'
import type { LegacyInstrumentType } from './types/audioGraph'

function App() {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const [currentInstrumentType, setCurrentInstrumentType] = useState<LegacyInstrumentType>('membraneSynth')
  const [currentConfig, setCurrentConfig] = useState(() => getInstrumentPreset('membraneSynth'))
  
  // Only initialize audio graph after audio is ready
  const { 
    config, 
    isPlaying,
    nodes,
    updateNodeInGraph, 
    triggerGraph, 
    releaseGraph, 
    getWaveformData
  } = useAudioGraph(isAudioInitialized ? currentConfig : null)

  const instrumentOptions = [
    { value: 'membraneSynth', label: 'Bass Kick' },
    { value: 'synth', label: 'Synth' }
  ]

  const handleAudioInitialization = async () => {
    try {
      // Load Tone.js module
      const Tone = await loadTone()
      
      // Start audio context
      await Tone.start()
      console.log('✅ Audio initialized successfully')
      
      // Add a small delay for smooth transition
      setTimeout(() => {
        setIsAudioInitialized(true)
      }, 300)
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error)
      throw error
    }
  }

  const changeInstrumentType = (type: LegacyInstrumentType) => {
    const newConfig = getInstrumentPreset(type)
    setCurrentInstrumentType(type)
    setCurrentConfig(newConfig)
  }

  // Helper function to update settings for the current instrument node
  const updateSettings = async (newSettings: Partial<SynthSettings | MembraneSynthSettings>) => {
    if (!config) return
    
    // Get the trigger node (the main instrument node)
    const triggerNode = Object.entries(config.graph.nodes)
      .find(([, nodeDef]) => nodeDef.trigger)?.[0]
    
    if (triggerNode) {
      // Check if the node actually exists before trying to update it
      const nodeExists = nodes.get(triggerNode)
      if (nodeExists && !nodeExists.isDisposed) {
        await updateNodeInGraph(triggerNode, newSettings)
      } else {
        console.warn('⚠️ Skipping settings update - node not ready:', triggerNode)
      }
    }
  }

  const renderInstrumentControls = () => {
    if (!config) return null
    
    // Get the trigger node settings for display
    const triggerNodeConfig = Object.entries(config.graph.nodes)
      .find(([, nodeDef]) => nodeDef.trigger)
    
    if (!triggerNodeConfig) return null
    
    const [nodeId] = triggerNodeConfig
    
    // Get actual node instance for current settings, fall back to config if needed  
    const nodeInstance = nodes.get(nodeId)
    const nodeSettings = nodeInstance?.settings || triggerNodeConfig[1].settings || {}

    // Ensure we have proper default settings for each instrument type
    const getDefaultSettingsForType = (type: LegacyInstrumentType, settings: Record<string, unknown>) => {
      if (type === 'synth') {
        return {
          frequency: 440,
          volume: -6,
          oscillatorType: 'sine',
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.3,
            release: 1.0,
            attackCurve: 'exponential',
            decayCurve: 'exponential', 
            releaseCurve: 'exponential'
          },
          ...settings
        }
      } else {
        return {
          volume: -6,
          pitchDecay: 0.05,
          octaves: 10,
          oscillatorType: 'sine',
          envelope: {
            attack: 0.001,
            decay: 0.4,
            sustain: 0.01,
            release: 1.4,
            sustainDuration: 0.1,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential'
          },
          ...settings
        }
      }
    }

    const safeSettings = getDefaultSettingsForType(currentInstrumentType, nodeSettings)

    switch (currentInstrumentType) {
      case 'synth':
        return (
          <SynthControls
            settings={safeSettings as SynthSettings}
            isPlaying={isPlaying}
            onSettingsChange={updateSettings}
            onPlay={() => triggerGraph()}
            onStop={() => releaseGraph()}
            getWaveformData={getWaveformData}
          />
        )
      
      case 'membraneSynth':
        return (
          <BassKickControls
            settings={safeSettings as MembraneSynthSettings}
            isPlaying={isPlaying}
            onSettingsChange={updateSettings}
            onTrigger={() => triggerGraph()}
            getWaveformData={getWaveformData}
          />
        )
      
      default:
        return null
    }
  }

  // Show initialization screen if audio isn't initialized
  if (!isAudioInitialized) {
    return <InitializationScreen onInitialize={handleAudioInitialization} />
  }

  return (
    <Transition
      mounted={isAudioInitialized}
      transition="fade"
      duration={500}
    >
      {(styles) => (
        <div style={styles}>
          <Box style={{ 
            minHeight: '100vh', 
            position: 'relative', 
            // Responsive padding - less on mobile for more content space
            paddingLeft: 'clamp(16px, 6vw, 40px)',
            paddingRight: 'clamp(16px, 6vw, 40px)'
          }}>
            {/* Debug Menu - Top Right */}
            <Box style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
              <DebugMenu />
            </Box>

            {/* Main Content - Centered */}
            <Center style={{ minHeight: '100vh', padding: '20px 0' }}>
              <Container size="sm" style={{ 
                width: '100%', 
                maxWidth: '640px', // Allow space for 600px graphs + padding
                padding: '0'
              }}>
                
                <Select
                  label="Choose Instrument"
                  value={currentInstrumentType}
                  onChange={(value) => changeInstrumentType(value as LegacyInstrumentType)}
                  data={instrumentOptions}
                  mb="xl"
                  style={{ width: '100%' }}
                />

                <Paper shadow="sm" p="md" withBorder style={{ width: '100%', boxSizing: 'border-box' }}>
                  {renderInstrumentControls()}
                </Paper>
              </Container>
            </Center>
          </Box>
        </div>
      )}
    </Transition>
  )
}

export default App
