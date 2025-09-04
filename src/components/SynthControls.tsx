import { Stack, Text, Slider, Select, Button, Group, Title } from '@mantine/core'
import { ADSRControls } from './ADSRControls'
import { WaveformVisualization } from './WaveformVisualization'
import type { SynthSettings } from '../types/instruments'
import type { ADSRSettings } from '../hooks/useADSR'

interface SynthControlsProps {
  settings: SynthSettings
  isPlaying: boolean
  onSettingsChange: (settings: Partial<SynthSettings>) => void
  onPlay: () => void
  onStop: () => void
  getWaveformData: () => Float32Array | null
}

export function SynthControls({ 
  settings, 
  isPlaying, 
  onSettingsChange, 
  onPlay,
  onStop,
  getWaveformData
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

      <WaveformVisualization
        getWaveformData={getWaveformData}
        adsrSettings={settings.envelope}
      />

      <div>
        <Text size="xs" mb="4px">
          Frequency: {settings.frequency >= 1000 ? `${(settings.frequency / 1000).toFixed(1)}k` : settings.frequency} Hz
        </Text>
        <Slider
          value={Math.log10(settings.frequency / 20) * 100}
          onChange={(scaledValue) => {
            const frequency = Math.round(20 * Math.pow(10, scaledValue / 100))
            onSettingsChange({ frequency })
          }}
          min={0}
          max={300}
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
        initialSettings={settings.envelope}
        onSettingsChange={handleADSRChange}
        totalDuration={settings.envelope.attack + settings.envelope.decay + settings.envelope.sustainDuration + settings.envelope.release}
      />
    </Stack>
  )
}