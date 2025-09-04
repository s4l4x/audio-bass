import { Stack, Text, Group, Button } from '@mantine/core'
import { useADSR } from '../hooks/useADSR'
import { GraphicalADSR } from './GraphicalADSR'
import type { UseADSROptions, ADSRSettings } from '../hooks/useADSR'

interface ADSRControlsProps extends UseADSROptions {
  onSettingsChange?: (settings: ADSRSettings) => void
  label?: string
}

export function ADSRControls({ 
  onSettingsChange, 
  label = "",
  initialSettings,
  ...adsrOptions 
}: ADSRControlsProps) {
  // Use the initialSettings directly if provided, otherwise use useADSR
  const { settings: defaultSettings, ranges } = useADSR(adsrOptions)
  const currentSettings = initialSettings ? { ...defaultSettings, ...initialSettings } : defaultSettings

  const handleGraphicalChange = (newSettings: ADSRSettings) => {
    onSettingsChange?.(newSettings)
  }

  const resetToDefaults = () => {
    handleGraphicalChange({
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      sustainDuration: 1.0,
      release: 1.0,
      attackCurve: 'exponential',
      decayCurve: 'exponential',
      releaseCurve: 'exponential'
    })
  }

  return (
    <Stack gap="sm">
      {label && (
        <Group justify="space-between" align="center">
          <Text size="md" fw={500}>
            {label}
          </Text>
          <Button size="xs" variant="subtle" onClick={resetToDefaults}>
            Reset
          </Button>
        </Group>
      )}

      <GraphicalADSR
        settings={currentSettings}
        onSettingsChange={handleGraphicalChange}
        ranges={ranges}
      />
    </Stack>
  )
}