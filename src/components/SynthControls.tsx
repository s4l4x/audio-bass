import { Stack, Text, Slider, Select, Button, Group } from '@mantine/core'
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
    <Stack gap="lg">
      <Group justify="center">
        <Button 
          w={80}
          h={80}
          onMouseDown={() => onPlay()}
          onMouseUp={() => onStop()}
          onMouseLeave={() => onStop()}
          variant={isPlaying ? "filled" : "outline"}
          style={{ outline: 'none' }}
        >
          PRESS
        </Button>
      </Group>

      <div>
        <Text size="sm" mb="xs">
          Frequency: {settings.frequency} Hz
        </Text>
        <Slider
          value={settings.frequency}
          onChange={(value) => onSettingsChange({ frequency: value })}
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
          onChange={(value) => onSettingsChange({ volume: value })}
          min={-30}
          max={6}
          step={1}
        />
      </div>

      <div>
        <Text size="sm" mb="xs">
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