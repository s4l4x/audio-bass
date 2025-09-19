import { Stack, Text, Slider, Select, Group, Title, useMantineTheme } from '@mantine/core'
import { useState } from 'react'
import { PlayButton } from './PlayButton'
import { JsonViewButton } from './JsonViewButton'
import { JsonModal } from './JsonModal'
import { useMediaQuery } from '@mantine/hooks'
import { EditableValue } from './EditableValue'
import { ADSRControls } from './ADSRControls'
import { WaveformVisualization } from './WaveformVisualization'
import type { SynthSettings } from '../types/instruments'
import type { SustainedADSRSettings } from '../hooks/useADSR'
import type { AudioGraphConfig } from '../types/audioGraph'

interface SynthControlsProps {
  settings: SynthSettings
  isPlaying: boolean
  onSettingsChange: (settings: Partial<SynthSettings>) => void
  onPlay: () => void
  onStop: () => void
  getWaveformData: () => Float32Array | null
  currentConfig: AudioGraphConfig | null
}

export function SynthControls({
  settings,
  isPlaying,
  onSettingsChange,
  onPlay,
  onStop,
  getWaveformData,
  currentConfig
}: SynthControlsProps) {
  const [jsonModalOpened, setJsonModalOpened] = useState(false)
  const theme = useMantineTheme()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const sliderSize = isMobile ? 'md' : 'sm'

  // Get responsive thumb size from theme
  const thumbSize = isMobile ? theme.other.slider.thumb.sizeMobile : theme.other.slider.thumb.size
  const sliderStyles = {
    thumb: {
      width: thumbSize,
      height: thumbSize,
    }
  }

  const handleADSRChange = (envelope: SustainedADSRSettings) => {
    onSettingsChange({ envelope })
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={4} size="xl" fw="500">Synth</Title>
        <Group gap="sm" align="center">
          <JsonViewButton
            onOpenModal={() => setJsonModalOpened(true)}
            color="gray"
            size="xs"
            width={30}
            height={30}
          />
          <PlayButton
            triggerType="sustained"
            isPlaying={isPlaying}
            onTrigger={() => { }} // Not used for sustained type
            onPlay={onPlay}
            onStop={onStop}
            color="blue"
            size="xs"
            width={30}
            height={30}
          />
        </Group>

      </Group>

      <WaveformVisualization
        getWaveformData={getWaveformData}
        adsrSettings={settings.envelope}
      />

      <div>
        <EditableValue
          label="Frequency"
          value={settings.frequency || 440}
          unit="Hz"
          onValueChange={(value) => onSettingsChange({ frequency: value })}
          formatDisplay={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
          min={20}
          max={20000}
        />
        <Slider
          value={Math.log10((settings.frequency || 440) / 20) * 100}
          onChange={(scaledValue) => {
            const frequency = Math.round(20 * Math.pow(10, scaledValue / 100))
            onSettingsChange({ frequency })
          }}
          min={0}
          max={300}
          step={1}
          size={sliderSize}
          styles={sliderStyles}
          label={(scaledValue) => {
            const frequency = Math.round(20 * Math.pow(10, scaledValue / 100))
            return `${frequency} Hz`
          }}
        />
      </div>

      <div>
        <EditableValue
          label="Volume"
          value={settings.volume}
          unit="dB"
          onValueChange={(value) => onSettingsChange({ volume: value })}
          min={-30}
          max={6}
        />
        <Slider
          value={settings.volume}
          onChange={(value) => onSettingsChange({ volume: value })}
          min={-30}
          max={6}
          step={1}
          size={sliderSize}
          styles={sliderStyles}
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
        instrumentType="sustained"
        initialSettings={settings.envelope}
        onSettingsChange={handleADSRChange}
        totalDuration={settings.envelope.attack + settings.envelope.decay + 1.0 + settings.envelope.release}
      />

      <JsonModal
        opened={jsonModalOpened}
        onClose={() => setJsonModalOpened(false)}
        config={currentConfig}
      />
    </Stack>
  )
}