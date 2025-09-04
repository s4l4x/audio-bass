import { Stack, Text, Slider, Select, Button, Group } from '@mantine/core'
import { ADSRControls } from './ADSRControls'
import { WaveformVisualization } from './WaveformVisualization'
import type { MembraneSynthSettings } from '../types/instruments'
import type { ADSRSettings } from '../hooks/useADSR'

interface BassKickControlsProps {
  settings: MembraneSynthSettings
  isPlaying: boolean
  onSettingsChange: (settings: Partial<MembraneSynthSettings>) => void
  onTrigger: () => void
  getWaveformData: () => Float32Array | null
}

export function BassKickControls({ 
  settings, 
  isPlaying,
  onSettingsChange, 
  onTrigger,
  getWaveformData
}: BassKickControlsProps) {
  const handleADSRChange = (envelope: ADSRSettings) => {
    onSettingsChange({ envelope })
  }

  return (
    <Stack gap="lg">
      <Group justify="center">
        <Button 
          w={80}
          h={80}
          onClick={onTrigger}
          variant={isPlaying ? "filled" : "outline"}
          color="red"
          style={{ outline: 'none' }}
        >
          TAP
        </Button>
      </Group>

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
          Pitch Decay: {settings.pitchDecay.toFixed(3)}s
        </Text>
        <Slider
          value={settings.pitchDecay}
          onChange={(value) => onSettingsChange({ pitchDecay: value })}
          min={0.001}
          max={0.5}
          step={0.001}
        />
      </div>

      <div>
        <Text size="sm" mb="xs">
          Octaves: {settings.octaves}
        </Text>
        <Slider
          value={settings.octaves}
          onChange={(value) => onSettingsChange({ octaves: value })}
          min={1}
          max={20}
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
        ranges={{
          attack: [0.001, 0.1],
          decay: [0.001, 2.0],
          sustain: [0.0, 1.0],
          release: [0.001, 3.0]
        }}
        onSettingsChange={handleADSRChange}
      />

      <WaveformVisualization
        getWaveformData={getWaveformData}
      />
    </Stack>
  )
}