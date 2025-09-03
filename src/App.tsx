import { Container, Title, Center, Select, Divider, Group } from '@mantine/core'
import { useInstrument } from './hooks/useInstrument'
import { SynthControls } from './components/SynthControls'
import { BassKickControls } from './components/BassKickControls'
import { AudioTestButton } from './components/AudioTestButton'
import type { InstrumentType, SynthSettings, MembraneSynthSettings } from './types/instruments'

function App() {
  const { 
    config, 
    isPlaying, 
    changeInstrumentType, 
    updateSettings, 
    triggerAttack, 
    triggerRelease, 
    triggerAttackRelease 
  } = useInstrument('synth')

  const instrumentOptions = [
    { value: 'synth', label: '🎹 Synthesizer' },
    { value: 'membraneSynth', label: '🥁 Bass Kick' },
    { value: 'amSynth', label: '📻 AM Synth' },
    { value: 'fmSynth', label: '🎛️ FM Synth' }
  ]

  const renderInstrumentControls = () => {
    switch (config.type) {
      case 'synth':
      case 'amSynth':
      case 'fmSynth':
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
            onSettingsChange={updateSettings}
            onTrigger={() => triggerAttackRelease()}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <Center style={{ minHeight: '100vh' }}>
      <Container size="sm">
        <Title order={1} ta="center" mb="xl">
          Audio Bass - Multi-Instrument Studio
        </Title>
        
        <Group justify="space-between" align="flex-end" mb="xl">
          <Select
            label="Choose Instrument"
            value={config.type}
            onChange={(value) => changeInstrumentType(value as InstrumentType)}
            data={instrumentOptions}
            style={{ flex: 1 }}
          />
          <AudioTestButton />
        </Group>

        <Divider mb="lg" />

        {renderInstrumentControls()}
      </Container>
    </Center>
  )
}

export default App
