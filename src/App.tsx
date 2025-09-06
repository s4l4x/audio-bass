import { Container, Center, Select, Box, Paper } from '@mantine/core'
import { useInstrument } from './hooks/useInstrument'
import { SynthControls } from './components/SynthControls'
import { BassKickControls } from './components/BassKickControls'
import { DebugMenu } from './components/DebugMenu'
import type { InstrumentType, SynthSettings, MembraneSynthSettings } from './types/instruments'

function App() {
  const { 
    config, 
    isPlaying, 
    changeInstrumentType, 
    updateSettings, 
    triggerAttack, 
    triggerRelease, 
    triggerAttackRelease,
    getWaveformData
  } = useInstrument('membraneSynth')

  const instrumentOptions = [
    { value: 'membraneSynth', label: 'Bass Kick' },
    { value: 'synth', label: 'Synth' }
  ]

  const renderInstrumentControls = () => {
    switch (config.type) {
      case 'synth':
        return (
          <SynthControls
            settings={config.settings as SynthSettings}
            isPlaying={isPlaying}
            onSettingsChange={updateSettings}
            onPlay={triggerAttack}
            onStop={triggerRelease}
            getWaveformData={getWaveformData}
          />
        )
      
      case 'membraneSynth':
        return (
          <BassKickControls
            settings={config.settings as MembraneSynthSettings}
            isPlaying={isPlaying}
            onSettingsChange={updateSettings}
            onTrigger={() => triggerAttackRelease()}
            getWaveformData={getWaveformData}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <Box style={{ 
      minHeight: '100vh', 
      position: 'relative', 
      // More aggressive responsive padding to prevent overflow
      paddingLeft: 'clamp(20px, 8vw, 40px)',
      paddingRight: 'clamp(20px, 8vw, 40px)'
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
            value={config.type}
            onChange={(value) => changeInstrumentType(value as InstrumentType)}
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
  )
}

export default App
