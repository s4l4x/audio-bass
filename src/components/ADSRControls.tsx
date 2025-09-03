import { Stack, Text, Slider, Group, Button } from '@mantine/core'
import { useADSR } from '../hooks/useADSR'
import type { UseADSROptions, ADSRSettings } from '../hooks/useADSR'

interface ADSRControlsProps extends UseADSROptions {
  onSettingsChange?: (settings: ADSRSettings) => void
  label?: string
}

export function ADSRControls({ 
  onSettingsChange, 
  label = "ADSR Envelope",
  ...adsrOptions 
}: ADSRControlsProps) {
  const { settings, ranges, updateSetting, resetToDefaults } = useADSR(adsrOptions)

  const handleSettingChange = (key: keyof ADSRSettings, value: number) => {
    updateSetting(key, value)
    const newSettings = { ...settings, [key]: value }
    onSettingsChange?.(newSettings)
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text size="md" fw={500}>
          {label}
        </Text>
        <Button 
          size="xs" 
          variant="light" 
          onClick={resetToDefaults}
        >
          Reset
        </Button>
      </Group>

      <div>
        <Text size="sm" mb="xs">
          Attack: {settings.attack.toFixed(3)}s
        </Text>
        <Slider
          value={settings.attack}
          onChange={(value) => handleSettingChange('attack', value)}
          min={ranges.attack[0]}
          max={ranges.attack[1]}
          step={0.001}
        />
      </div>

      <div>
        <Text size="sm" mb="xs">
          Decay: {settings.decay.toFixed(3)}s
        </Text>
        <Slider
          value={settings.decay}
          onChange={(value) => handleSettingChange('decay', value)}
          min={ranges.decay[0]}
          max={ranges.decay[1]}
          step={0.001}
        />
      </div>

      <div>
        <Text size="sm" mb="xs">
          Sustain: {settings.sustain.toFixed(2)}
        </Text>
        <Slider
          value={settings.sustain}
          onChange={(value) => handleSettingChange('sustain', value)}
          min={ranges.sustain[0]}
          max={ranges.sustain[1]}
          step={0.01}
        />
      </div>

      <div>
        <Text size="sm" mb="xs">
          Release: {settings.release.toFixed(3)}s
        </Text>
        <Slider
          value={settings.release}
          onChange={(value) => handleSettingChange('release', value)}
          min={ranges.release[0]}
          max={ranges.release[1]}
          step={0.001}
        />
      </div>
    </Stack>
  )
}