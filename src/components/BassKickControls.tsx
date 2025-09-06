import { Stack, Text, Slider, Select, Group, Title, useMantineTheme } from '@mantine/core'
import { PlayButton } from './PlayButton'
import { useMediaQuery } from '@mantine/hooks'
import { EditableValue } from './EditableValue'
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
  
  const handleADSRChange = (envelope: ADSRSettings) => {
    onSettingsChange({ envelope })
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={4} size="xl" fw="400">Bass Kick</Title>
        <PlayButton
          triggerType="pulse"
          isPlaying={isPlaying}
          onTrigger={onTrigger}
          color="red"
          size="xs"
          width={30}
          height={30}
        />
      </Group>

      <WaveformVisualization
        getWaveformData={getWaveformData}
        adsrSettings={settings.envelope}
      />

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
        <EditableValue
          label="Pitch Decay"
          value={settings.pitchDecay}
          unit="s"
          onValueChange={(value) => onSettingsChange({ pitchDecay: value })}
          min={0.001}
          max={0.5}
        />
        <Slider
          value={settings.pitchDecay}
          onChange={(value) => onSettingsChange({ pitchDecay: value })}
          min={0.001}
          max={0.5}
          step={0.001}
          size={sliderSize}
          styles={sliderStyles}
        />
      </div>

      <div>
        <EditableValue
          label="Octaves"
          value={settings.octaves}
          unit=""
          onValueChange={(value) => onSettingsChange({ octaves: value })}
          min={1}
          max={20}
        />
        <Slider
          value={settings.octaves}
          onChange={(value) => onSettingsChange({ octaves: value })}
          min={1}
          max={20}
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