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

  // Get instrument type for specialized controls
  const instrumentType = triggerNodeEntry[1].type

  // Get instrument description
  const getInstrumentDescription = (instrumentType: string) => {
    const descriptions: Record<string, string> = {
      'Synth': 'Basic oscillator synthesis with ADSR envelope control',
      'MembraneSynth': 'Physical modeling synthesis for bass kick drums and percussive sounds',
      'AMSynth': 'Amplitude modulation synthesis creates tremolo and harmonic sidebands',
      'FMSynth': 'Frequency modulation synthesis for bell-like, metallic, and complex harmonic timbres',
      'DuoSynth': 'Two oscillator synthesis with independent voice control and envelopes',
      'MonoSynth': 'Monophonic synthesis with filter envelope for classic analog-style sounds',
      'PluckSynth': 'Karplus-Strong synthesis for modeling plucked string instruments',
      'MetalSynth': 'Frequency modulation optimized for metallic percussion and bell sounds',
      'NoiseSynth': 'Noise-based synthesis perfect for percussion, drums, and sound effects',
      'PolySynth': 'Polyphonic synthesis for playing chords and multiple simultaneous notes'
    }
    return descriptions[instrumentType] || ''
  }

  const instrumentDescription = getInstrumentDescription(instrumentType)

  // Handle ADSR settings changes
  const handleADSRChange = (envelope: ADSRSettings | SustainedADSRSettings) => {
    onSettingsChange({ envelope })
  }

  // Handle DuoSynth voice settings changes (currently unused, but kept for future use)
  // const handleVoiceChange = (voiceIndex: 0 | 1, voiceSettings: Record<string, unknown>) => {
  //   onSettingsChange({
  //     [`voice${voiceIndex}`]: {
  //       ...((settings[`voice${voiceIndex}`] as Record<string, unknown>) || {}),
  //       ...voiceSettings
  //     }
  //   })
  // }

  // Handle nested oscillator settings for voices
  const handleVoiceOscillatorChange = (voiceIndex: 0 | 1, oscSettings: Record<string, unknown>) => {
    const currentVoice = (settings[`voice${voiceIndex}`] as Record<string, unknown>) || {}
    const currentOscillator = (currentVoice.oscillator as Record<string, unknown>) || {}

    console.log(`🎛️ Updating voice${voiceIndex} oscillator:`, oscSettings)
    console.log(`🎛️ Current voice${voiceIndex}:`, currentVoice)

    // Only send the oscillator part, not the entire voice with envelope
    const updatedSettings = {
      [`voice${voiceIndex}`]: {
        oscillator: {
          ...currentOscillator,
          ...oscSettings
        }
        // Deliberately NOT including envelope here
      }
    }

    console.log(`🎛️ Updated settings for voice${voiceIndex}:`, updatedSettings)
    onSettingsChange(updatedSettings)
  }

  // Handle PolySynth voice settings changes
  const handlePolySynthVoiceChange = (voiceSettings: Record<string, unknown>) => {
    console.log('🎛️ Updating PolySynth voice settings:', voiceSettings)
    onSettingsChange({
      voice: {
        ...((settings.voice as Record<string, unknown>) || {}),
        ...voiceSettings
      }
    })
  }

  // Handle nested envelope settings for voices
  const handleVoiceEnvelopeChange = (voiceIndex: 0 | 1, envSettings: Record<string, unknown>) => {
    const currentVoice = (settings[`voice${voiceIndex}`] as Record<string, unknown>) || {}
    const currentEnvelope = (currentVoice.envelope as Record<string, unknown>) || {}

    console.log(`🎚️ Updating voice${voiceIndex} envelope:`, envSettings)
    console.log(`🎚️ Current voice${voiceIndex}:`, currentVoice)

    // Only send the envelope part, not the entire voice with oscillator
    const updatedSettings = {
      [`voice${voiceIndex}`]: {
        envelope: {
          ...currentEnvelope,
          ...envSettings
        }
        // Deliberately NOT including oscillator here
      }
    }

    console.log(`🎚️ Updated settings for voice${voiceIndex}:`, updatedSettings)
    onSettingsChange(updatedSettings)
  }

  // Render PolySynth-specific controls
  const renderPolySynthControls = () => {
    const voice = (settings.voice as Record<string, unknown>) || {}
    const voiceOsc = (voice.oscillator as Record<string, unknown>) || {}

    return (
      <Stack gap="md">
        <Text fw={500} size="sm">Voice</Text>
        <Select
          value={voiceOsc.type as string || 'sawtooth'}
          onChange={(value) => handlePolySynthVoiceChange({ oscillator: { type: value } })}
          data={[
            { value: 'sine', label: 'Sine' },
            { value: 'sawtooth', label: 'Sawtooth' },
            { value: 'square', label: 'Square' },
            { value: 'triangle', label: 'Triangle' }
          ]}
          size="xs"
        />
        <ADSRControls
          instrumentType={triggerType === 'sustained' ? 'sustained' : 'percussive'}
          initialSettings={((settings.voice as Record<string, unknown>)?.envelope as ADSRSettings) || {
            attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0
          }}
          onSettingsChange={(envelope) => handlePolySynthVoiceChange({ envelope })}
        />
      </Stack>
    )
  }

  // Render DuoSynth-specific controls
  const renderDuoSynthControls = () => {
    const voice0 = (settings.voice0 as Record<string, unknown>) || {}
    const voice1 = (settings.voice1 as Record<string, unknown>) || {}
    const voice0Osc = (voice0.oscillator as Record<string, unknown>) || {}
    const voice1Osc = (voice1.oscillator as Record<string, unknown>) || {}

    return (
      <Stack gap="md">
        {/* Voice 0 */}
        <Text fw={500} size="sm">Voice 0</Text>
        <Select
          value={voice0Osc.type as string || 'sine'}
          onChange={(value) => handleVoiceOscillatorChange(0, { type: value })}
          data={[
            { value: 'sine', label: 'Sine' },
            { value: 'sawtooth', label: 'Sawtooth' },
            { value: 'square', label: 'Square' },
            { value: 'triangle', label: 'Triangle' }
          ]}
          size="xs"
        />
        <ADSRControls
          instrumentType={triggerType === 'sustained' ? 'sustained' : 'percussive'}
          initialSettings={((settings.voice0 as Record<string, unknown>)?.envelope as ADSRSettings) || {
            attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0
          }}
          onSettingsChange={(envelope) => handleVoiceEnvelopeChange(0, envelope as unknown as Record<string, unknown>)}
        />

        {/* Voice 1 */}
        <Text fw={500} size="sm">Voice 1</Text>
        <Select
          value={voice1Osc.type as string || 'sawtooth'}
          onChange={(value) => handleVoiceOscillatorChange(1, { type: value })}
          data={[
            { value: 'sine', label: 'Sine' },
            { value: 'sawtooth', label: 'Sawtooth' },
            { value: 'square', label: 'Square' },
            { value: 'triangle', label: 'Triangle' }
          ]}
          size="xs"
        />
        <ADSRControls
          instrumentType={triggerType === 'sustained' ? 'sustained' : 'percussive'}
          initialSettings={((settings.voice1 as Record<string, unknown>)?.envelope as ADSRSettings) || {
            attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0
          }}
          onSettingsChange={(envelope) => handleVoiceEnvelopeChange(1, envelope as unknown as Record<string, unknown>)}
        />
      </Stack>
    )
  }

  // Generate parameter controls based on settings
  const renderParameterControls = () => {
    const controls: ReactElement[] = []

    Object.entries(settings).forEach(([paramName, paramValue]) => {
      // Skip voice parameters for DuoSynth as they are handled separately
      if (instrumentType === 'DuoSynth' && (paramName === 'voice0' || paramName === 'voice1')) {
        return
      }

      if (!shouldShowParameter(paramName)) {
        return
      }

      const metadata = getParameterMetadata(paramName, instrumentType)
      if (!metadata) {
        return
      }

      const key = `${paramName}-control`

      if (metadata.controlType === 'slider') {
        // Ensure paramValue is a number for slider controls
        const numericValue = typeof paramValue === 'number' ? paramValue : 0
        let sliderValue = numericValue
        const displayValue = numericValue

        // Handle logarithmic scaling for frequency
        if (metadata.scale === 'logarithmic' && metadata.toSlider) {
          sliderValue = metadata.toSlider(numericValue)
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
              description={metadata.description}
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
              value={typeof paramValue === 'string' ? paramValue : ''}
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
        <Stack gap={4} w="100%">
          <Group w="100%" align="center" justify="space-between">
            <Title order={4} size="xl" fw={triggerType === 'sustained' ? '500' : '400'}>
              {instrumentName}
            </Title>
            <JsonViewButton
              onOpenModal={() => setJsonModalOpened(true)}
              color="gray"
              size="xs"
              width={20}
              height={20}
            />
          </Group>
          {instrumentDescription && (
            <Text size="sm" c="dimmed" style={{ maxWidth: '400px' }}>
              {instrumentDescription}
            </Text>
          )}
          <PlayButton
            triggerType={triggerType === 'momentary' ? 'pulse' : 'sustained'}
            isPlaying={isPlaying}
            onTrigger={onTrigger || (() => { })}
            onPlay={onPlay}
            onStop={onStop}
            color={triggerType === 'sustained' ? 'blue' : 'red'}
            size="xs"
            width={30}
            height={30}
          />
        </Stack>


      </Group>

      <WaveformVisualization
        getWaveformData={getWaveformData}
        adsrSettings={settings.envelope as ADSRSettings | SustainedADSRSettings}
      />

      {renderParameterControls()}

      {/* DuoSynth-specific controls */}
      {instrumentType === 'DuoSynth' && renderDuoSynthControls()}

      {/* PolySynth-specific controls */}
      {instrumentType === 'PolySynth' && renderPolySynthControls()}

      {/* Main envelope controls - only for non-DuoSynth, non-PluckSynth, and non-PolySynth instruments */}
      {instrumentType !== 'DuoSynth' && instrumentType !== 'PluckSynth' && instrumentType !== 'PolySynth' && (
        <Stack gap="xs">
          <ADSRControls
            instrumentType={triggerType === 'sustained' ? 'sustained' : 'percussive'}
            initialSettings={settings.envelope as ADSRSettings | SustainedADSRSettings}
            ranges={triggerType === 'sustained' ? undefined : {
              attack: [0.001, 0.1],
              decay: [0.001, 2.0],
              sustain: [0.0, 1.0],
              release: [0.001, 3.0]
            }}
            onSettingsChange={handleADSRChange}
            totalDuration={(() => {
              const envelope = settings.envelope as ADSRSettings | SustainedADSRSettings
              if (!envelope) return 0

              const baseTime = envelope.attack + envelope.decay + envelope.release
              return triggerType === 'sustained' ?
                baseTime + 1.0 :
                baseTime + (('sustainDuration' in envelope) ? envelope.sustainDuration : 0)
            })()}
          />
        </Stack>
      )}


      <JsonModal
        opened={jsonModalOpened}
        onClose={() => setJsonModalOpened(false)}
        config={config}
      />
    </Stack>
  )
}