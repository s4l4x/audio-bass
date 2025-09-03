import { Container, Title, Button, Stack, Slider, Text, Center } from '@mantine/core'
import { useSynth } from './hooks/useSynth'

function App() {
  const { isPlaying, settings, togglePlay, updateSettings } = useSynth()

  return (
    <Center style={{ minHeight: '100vh' }}>
      <Container size="sm">
        <Title order={1} ta="center" mb="xl">
          Audio Bass - Tone.js Demo
        </Title>
        
        <Stack gap="lg">
          <Button 
            size="lg" 
            onClick={togglePlay}
            variant={isPlaying ? "filled" : "outline"}
          >
            {isPlaying ? 'Stop' : 'Play'} Tone
          </Button>

          <div>
            <Text size="sm" mb="xs">
              Frequency: {settings.frequency} Hz
            </Text>
            <Slider
              value={settings.frequency}
              onChange={(value) => updateSettings({ frequency: value })}
              min={200}
              max={800}
              step={1}
            />
          </div>

          <div>
            <Text size="sm" mb="xs">
              Volume: {settings.volume} dB
            </Text>
            <Slider
              value={settings.volume}
              onChange={(value) => updateSettings({ volume: value })}
              min={-40}
              max={0}
              step={1}
            />
          </div>
        </Stack>
      </Container>
    </Center>
  )
}

export default App
