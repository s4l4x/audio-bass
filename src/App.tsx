import { Container, Title, Center, Select, Divider, Box, Paper } from '@mantine/core'
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
    { value: 'synth', label: 'Synthesizer' }
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
    <Box style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Debug Menu - Top Right */}
      <Box style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <DebugMenu />
      </Box>

      {/* Main Content - Centered */}
      <Center style={{ minHeight: '100vh' }}>
        <Container size="sm">
          
          <Select
            label="Choose Instrument"
            value={config.type}
            onChange={(value) => changeInstrumentType(value as InstrumentType)}
            data={instrumentOptions}
            mb="xl"
          />

          <Paper shadow="sm" p="lg" withBorder>
            {renderInstrumentControls()}
          </Paper>
        </Container>
      </Center>
    </Box>
  )
}

export default App
