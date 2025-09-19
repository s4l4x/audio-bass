import { Container, Center, Select, Box, Paper, Transition } from '@mantine/core'
import { useState } from 'react'
import { useAudioGraph } from './hooks/useAudioGraph'
import { InstrumentControls } from './components/InstrumentControls'
import { DebugMenu } from './components/DebugMenu'
import { InitializationScreen } from './components/InitializationScreen'
import { getInstrumentPreset, getAvailableInstruments, instrumentPresets } from './config/instrumentPresets'
import { loadTone } from './utils/toneLoader'
import type { SynthSettings, MembraneSynthSettings } from './types/instruments'

function App() {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const [currentInstrumentType, setCurrentInstrumentType] = useState<keyof typeof instrumentPresets>('membraneSynth')
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

  const instrumentOptions = getAvailableInstruments()
    .map(instrument => ({
      value: instrument.key,
      label: instrument.name,
      disabled: instrument.disabled || false
    }))

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

  const changeInstrumentType = (type: keyof typeof instrumentPresets) => {
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
    const getDefaultSettingsForType = (type: keyof typeof instrumentPresets, settings: Record<string, unknown>) => {
      // Use the preset configuration as default and merge with actual settings
      const presetConfig = getInstrumentPreset(type)
      const triggerNode = Object.entries(presetConfig.graph.nodes)
        .find(([, nodeDef]) => nodeDef.trigger)
      
      if (triggerNode) {
        return {
          ...triggerNode[1].settings,
          ...settings
        }
      }
      
      // Fallback defaults
      return {
        frequency: 440,
        volume: -6,
        ...settings
      }
    }

    const safeSettings = getDefaultSettingsForType(currentInstrumentType, nodeSettings)

    return (
      <InstrumentControls
        config={config}
        settings={safeSettings}
        isPlaying={isPlaying}
        onSettingsChange={updateSettings}
        onTrigger={config?.graph.trigger === 'momentary' ? () => triggerGraph() : undefined}
        onPlay={config?.graph.trigger === 'sustained' ? () => triggerGraph() : undefined}
        onStop={config?.graph.trigger === 'sustained' ? () => releaseGraph() : undefined}
        getWaveformData={getWaveformData}
      />
    )
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
                  onChange={(value) => changeInstrumentType(value as keyof typeof instrumentPresets)}
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
