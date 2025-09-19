import { Stack, Text, Slider, Select, Group, Title, useMantineTheme } from '@mantine/core'
import { useState } from 'react'
import type { ReactElement } from 'react'
import { PlayButton } from './PlayButton'
import { JsonViewButton } from './JsonViewButton'
import { JsonModal } from './JsonModal'
import { useMediaQuery } from '@mantine/hooks'
import { EditableValue } from './EditableValue'
import { ADSRControls } from './ADSRControls'
import { WaveformVisualization } from './WaveformVisualization'
import type { AudioGraphConfig } from '../types/audioGraph'
import type { ADSRSettings, SustainedADSRSettings } from '../hooks/useADSR'
import { getParameterMetadata, shouldShowParameter } from '../types/parameterMetadata'

interface InstrumentControlsProps {
  config: AudioGraphConfig | null
  settings: Record<string, unknown>
  isPlaying: boolean
  onSettingsChange: (settings: Record<string, unknown>) => void
  onTrigger?: () => void
  onPlay?: () => void
  onStop?: () => void
  getWaveformData: () => Float32Array | null
}

export function InstrumentControls({
  config,
  settings,
  isPlaying,
  onSettingsChange,
  onTrigger,
  onPlay,
  onStop,
  getWaveformData
}: InstrumentControlsProps) {
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

  if (!config) {
    return null
  }

  // Find the trigger node (instrument) in the config
  const triggerNodeEntry = Object.entries(config.graph.nodes).find(([, node]) => node.trigger)
  if (!triggerNodeEntry) {
    return null
  }

  const triggerType = config.graph.trigger
  const instrumentName = config.name

  // Handle ADSR settings changes
  const handleADSRChange = (envelope: ADSRSettings | SustainedADSRSettings) => {
    onSettingsChange({ envelope })
  }

  // Generate parameter controls based on settings
  const renderParameterControls = () => {
    const controls: ReactElement[] = []

    Object.entries(settings).forEach(([paramName, paramValue]) => {
      if (!shouldShowParameter(paramName)) {
        return
      }

      const metadata = getParameterMetadata(paramName)
      if (!metadata) {
        return
      }

      const key = `${paramName}-control`

      if (metadata.controlType === 'slider') {
        let sliderValue = paramValue
        const displayValue = paramValue

        // Handle logarithmic scaling for frequency
        if (metadata.scale === 'logarithmic' && metadata.toSlider) {
          sliderValue = metadata.toSlider(paramValue)
        }

        controls.push(
          <div key={key}>
            <EditableValue
              label={paramName.charAt(0).toUpperCase() + paramName.slice(1)}
              value={displayValue}
              unit={metadata.unit || ''}
              onValueChange={(value) => onSettingsChange({ [paramName]: value })}
              formatDisplay={metadata.formatDisplay}
              min={metadata.scale === 'logarithmic' ? 20 : metadata.range?.min}
              max={metadata.scale === 'logarithmic' ? 20000 : metadata.range?.max}
            />
            <Slider
              value={sliderValue}
              onChange={(value) => {
                let actualValue = value
                if (metadata.scale === 'logarithmic' && metadata.fromSlider) {
                  actualValue = metadata.fromSlider(value)
                }
                onSettingsChange({ [paramName]: actualValue })
              }}
              min={metadata.range?.min || 0}
              max={metadata.range?.max || 100}
              step={metadata.range?.step || 1}
              size={sliderSize}
              styles={sliderStyles}
              label={metadata.scale === 'logarithmic' && metadata.fromSlider ? 
                (sliderValue) => {
                  const actualValue = metadata.fromSlider!(sliderValue)
                  return `${actualValue} ${metadata.unit || ''}`
                } : undefined
              }
            />
          </div>
        )
      } else if (metadata.controlType === 'select' && metadata.options) {
        controls.push(
          <div key={key}>
            <Text size="xs" mb="4px">
              {paramName.charAt(0).toUpperCase() + paramName.slice(1)}
            </Text>
            <Select
              value={paramValue}
              onChange={(value) => onSettingsChange({ [paramName]: value })}
              data={metadata.options}
              size="xs"
            />
          </div>
        )
      }
    })

    return controls
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={4} size="xl" fw={triggerType === 'sustained' ? '500' : '400'}>
          {instrumentName}
        </Title>
        <Group gap="sm" align="center">
          <JsonViewButton
            onOpenModal={() => setJsonModalOpened(true)}
            color="gray"
            size="xs"
            width={30}
            height={30}
          />
          <PlayButton
            triggerType={triggerType === 'momentary' ? 'pulse' : 'sustained'}
            isPlaying={isPlaying}
            onTrigger={onTrigger || (() => {})}
            onPlay={onPlay}
            onStop={onStop}
            color={triggerType === 'sustained' ? 'blue' : 'red'}
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

      {renderParameterControls()}

      <ADSRControls
        instrumentType={triggerType === 'sustained' ? 'sustained' : 'percussive'}
        initialSettings={settings.envelope}
        ranges={triggerType === 'sustained' ? undefined : {
          attack: [0.001, 0.1],
          decay: [0.001, 2.0],
          sustain: [0.0, 1.0],
          release: [0.001, 3.0]
        }}
        onSettingsChange={handleADSRChange}
        totalDuration={triggerType === 'sustained' ? 
          settings.envelope.attack + settings.envelope.decay + 1.0 + settings.envelope.release :
          settings.envelope.attack + settings.envelope.decay + settings.envelope.sustainDuration + settings.envelope.release
        }
      />

      <JsonModal
        opened={jsonModalOpened}
        onClose={() => setJsonModalOpened(false)}
        config={config}
      />
    </Stack>
  )
}