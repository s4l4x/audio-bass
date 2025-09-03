import { Stack, Text, Group, ActionIcon } from '@mantine/core'
import { useADSR } from '../hooks/useADSR'
import { GraphicalADSR } from './GraphicalADSR'
import type { UseADSROptions, ADSRSettings } from '../hooks/useADSR'
import { IconRefresh } from '@tabler/icons-react'

interface ADSRControlsProps extends UseADSROptions {
  onSettingsChange?: (settings: ADSRSettings) => void
  label?: string
}

export function ADSRControls({ 
  onSettingsChange, 
  label = "ADSR Envelope",
  initialSettings,
  ...adsrOptions 
}: ADSRControlsProps) {
  // Use the initialSettings directly if provided, otherwise use useADSR
  const { settings: defaultSettings } = useADSR(adsrOptions)
  const currentSettings = initialSettings ? { ...defaultSettings, ...initialSettings } : defaultSettings

  const handleGraphicalChange = (newSettings: ADSRSettings) => {
    onSettingsChange?.(newSettings)
  }

  return (
    <Stack gap="sm">
      {/* Simple Header */}
      <Group justify="space-between" align="center">
        <Text size="md" fw={500}>
          {label}
        </Text>
        <ActionIcon 
          variant="subtle" 
          size="sm"
          onClick={() => handleGraphicalChange({
            attack: 0.01,
            decay: 0.3,
            sustain: 0.3,
            release: 1.0,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential'
          })}
          aria-label="Reset to defaults"
        >
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>

      {/* Always Visual ADSR */}
      <GraphicalADSR
        settings={currentSettings}
        onSettingsChange={handleGraphicalChange}
      />
    </Stack>
  )
}