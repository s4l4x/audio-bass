import { Stack, Text, Slider, Select, Button, Group, Title } from '@mantine/core'
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
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={4} size="md" fw="500">Bass Kick</Title>
        <Button 
          w={30}
          h={30}
          onClick={onTrigger}
          variant={isPlaying ? "filled" : "outline"}
          color="red"
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
            backgroundColor: isPlaying ? 'white' : 'var(--mantine-color-red-6)'
          }} />
        </Button>
      </Group>

      <WaveformVisualization
        getWaveformData={getWaveformData}
        adsrSettings={settings.envelope}
      />

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
          Pitch Decay: {settings.pitchDecay.toFixed(3)}s
        </Text>
        <Slider
          value={settings.pitchDecay}
          onChange={(value) => onSettingsChange({ pitchDecay: value })}
          min={0.001}
          max={0.5}
          step={0.001}
          size="sm"
        />
      </div>

      <div>
        <Text size="xs" mb="4px">
          Octaves: {settings.octaves}
        </Text>
        <Slider
          value={settings.octaves}
          onChange={(value) => onSettingsChange({ octaves: value })}
          min={1}
          max={20}
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
        initialSettings={settings.envelope}
        ranges={{
          attack: [0.001, 0.1],
          decay: [0.001, 2.0],
          sustain: [0.0, 1.0],
          release: [0.001, 3.0]
        }}
        onSettingsChange={handleADSRChange}
        totalDuration={settings.envelope.attack + settings.envelope.decay + settings.envelope.sustainDuration + settings.envelope.release}
      />
    </Stack>
  )
}