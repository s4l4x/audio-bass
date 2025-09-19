import { Modal, ScrollArea, Code, Box, Group, ActionIcon } from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import { IconCopy, IconCheck, IconX } from '@tabler/icons-react'
import type { AudioGraphConfig } from '../types/audioGraph'

export interface JsonModalProps {
  opened: boolean
  onClose: () => void
  config: AudioGraphConfig | null
}

export function JsonModal({ opened, onClose, config }: JsonModalProps) {
  const jsonString = config ? JSON.stringify(config, null, 2) : ''
  const clipboard = useClipboard({ timeout: 2000 })

  const handleCopy = () => {
    clipboard.copy(jsonString)
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Audio Graph Configuration"
      size="lg"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
      withCloseButton={false}
      styles={{
        header: {
          position: 'relative'
        }
      }}
    >
      <Box style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000 }}>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            color={clipboard.copied ? 'teal' : 'gray'}
            onClick={handleCopy}
            disabled={!config}
            size="sm"
          >
            {clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onClose}
            size="sm"
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </Box>
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