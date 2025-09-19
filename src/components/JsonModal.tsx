import { Modal, ScrollArea, Code, Title, Box } from '@mantine/core'
import type { AudioGraphConfig } from '../types/audioGraph'

export interface JsonModalProps {
  opened: boolean
  onClose: () => void
  config: AudioGraphConfig | null
}

export function JsonModal({ opened, onClose, config }: JsonModalProps) {
  const jsonString = config ? JSON.stringify(config, null, 2) : ''

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>Audio Graph Configuration</Title>}
      size="lg"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Box>
        {config ? (
          <ScrollArea.Autosize mah={500}>
            <Code
              block
              fz="xs"
              style={{ 
                whiteSpace: 'pre-wrap',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            >
              {jsonString}
            </Code>
          </ScrollArea.Autosize>
        ) : (
          <Box p="md">
            <Code>No configuration available</Code>
          </Box>
        )}
      </Box>
    </Modal>
  )
}