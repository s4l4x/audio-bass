import { Stack, Text, Slider, Select, Button, Group, Title } from '@mantine/core'
import { ADSRControls } from './ADSRControls'
import type { SynthSettings } from '../types/instruments'
import type { ADSRSettings } from '../hooks/useADSR'

interface SynthControlsProps {
  settings: SynthSettings
  isPlaying: boolean
  onSettingsChange: (settings: Partial<SynthSettings>) => void
  onPlay: () => void
  onStop: () => void
}

export function SynthControls({ 
  settings, 
  isPlaying, 
  onSettingsChange, 
  onPlay,
  onStop 
}: SynthControlsProps) {
  const handleADSRChange = (envelope: ADSRSettings) => {
    onSettingsChange({ envelope })
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={4} size="md" fw="500">Synthesizer</Title>
        <Button 
          w={30}
          h={30}
          onMouseDown={() => onPlay()}
          onMouseUp={() => onStop()}
          onMouseLeave={() => onStop()}
          variant={isPlaying ? "filled" : "outline"}
          size="xs"
          style={{ 
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isPlaying ? 'white' : 'var(--mantine-color-blue-6)'
          }} />
        </Button>
      </Group>

      <div>
        <Text size="xs" mb="4px">
          Frequency: {settings.frequency} Hz
        </Text>
        <Slider
          value={settings.frequency}
          onChange={(value) => onSettingsChange({ frequency: value })}
          min={200}
          max={800}
          step={1}
          size="sm"
        />
      </div>

      <div>
        <Text size="xs" mb="4px">
          Volume: {settings.volume} dB
        </Text>
        <Slider
          value={settings.volume}
          onChange={(value) => onSettingsChange({ volume: value })}
          min={-30}
          max={6}
          step={1}
          size="sm"
        />
      </div>

      <div>
        <Text size="xs" mb="4px">
          Oscillator Type
        </Text>
        <Select
          value={settings.oscillatorType}
          onChange={(value) => onSettingsChange({ oscillatorType: value as 'sine' | 'square' | 'sawtooth' | 'triangle' })}
          data={[
            { value: 'sine', label: 'Sine' },
            { value: 'square', label: 'Square' },
            { value: 'sawtooth', label: 'Sawtooth' },
            { value: 'triangle', label: 'Triangle' }
          ]}
          size="xs"
        />
      </div>

      <ADSRControls
        label="ADSR"
        initialSettings={settings.envelope}
        onSettingsChange={handleADSRChange}
      />
    </Stack>
  )
}