import { useState } from 'react'
import { Text, Modal, Button } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

interface EditableValueProps {
  label: string
  value: number
  unit: string
  onValueChange: (value: number) => void
  formatDisplay?: (value: number) => string
  min?: number
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  mb?: string | number
  description?: string  // Optional description for info tooltip
}

export function EditableValue({
  label,
  value,
  unit,
  onValueChange,
  formatDisplay,
  // min and max are kept in interface for backwards compatibility but not used
  min = -Infinity,
  max = Infinity,
  size = 'xs',
  mb = '4px',
  description
}: EditableValueProps) {
  // Explicitly mark min/max as intentionally unused to avoid TS warnings
  void min
  void max
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value.toString())
  const [infoModalOpened, setInfoModalOpened] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const displayValue = formatDisplay ? formatDisplay(value) : value.toString()

  const handleEdit = () => {
    setTempValue(value.toString())
    setIsEditing(true)
  }

  const handleLabelClick = () => {
    if (description && isMobile) {
      setInfoModalOpened(true)
    }
    // On desktop with description, hover will show tooltip
    // On desktop/mobile without description, do nothing special
  }

  const handleSubmit = () => {
    const newValue = parseFloat(tempValue)
    if (!isNaN(newValue)) {
      // Allow any valid number, even if outside min/max range
      // Let the synthesizer handle clamping if needed
      onValueChange(newValue)
    } else {
      // Only revert if it's not a valid number at all
      setTempValue(value.toString())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit()
    } else if (event.key === 'Escape') {
      setTempValue(value.toString())
      setIsEditing(false)
    }
    // Remove restrictive keyboard validation - let users type freely
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = event.currentTarget.value.replace(` ${unit}`, '').replace(unit, '')
    // Allow users to type freely - only do minimal cleanup
    setTempValue(inputValue)
  }

  // Render the label with optional tooltip/modal functionality
  const renderLabel = () => {
    if (!description) {
      // No description - render plain label
      return <span>{label}</span>
    }

    if (isMobile) {
      // Mobile with description - clickable label
      return (
        <span
          onClick={handleLabelClick}
          style={{
            cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textUnderlineOffset: '2px',
          }}
        >
          {label}
        </span>
      )
    } else {
      // Desktop with description - hoverable label with tooltip
      return (
        <span
          title={description}
          style={{
            cursor: 'help',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textUnderlineOffset: '2px',
            position: 'relative',
          }}
        >
          {label}
        </span>
      )
    }
  }

  return (
    <>
      <Text size={size} mb={mb} style={{ whiteSpace: 'nowrap' }}>
        {isEditing ? (
          <>
            {label}: <input
              type="text"
              value={`${tempValue} ${unit}`}
              onChange={handleChange}
              onBlur={handleSubmit}
              onKeyDown={handleKeyDown}
              style={{
                display: 'inline',
                fontSize: `var(--mantine-font-size-${size})`,
                lineHeight: `var(--mantine-line-height-${size})`,
                minHeight: 'unset',
                height: `var(--mantine-line-height-${size})`,
                padding: '0 2px',
                border: 'none',
                background: 'transparent',
                width: `${Math.max(tempValue.length + unit.length + 2, 8)}ch`,
                outline: 'none',
                fontFamily: 'inherit'
              }}
              autoFocus
              onFocus={(event) => {
                // Select just the number part, not the unit
                const input = event.currentTarget
                input.setSelectionRange(0, tempValue.length)
              }}
            />
          </>
        ) : (
          <>
            {renderLabel()}: <span
              onClick={handleEdit}
              style={{
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {displayValue}
            </span> {unit}
          </>
        )}
      </Text>

      {/* Mobile modal for parameter info */}
      {description && isMobile && (
        <Modal
          opened={infoModalOpened}
          onClose={() => setInfoModalOpened(false)}
          title={`${label} Parameter`}
          size="sm"
          centered
        >
          <Text size="sm" mb="md">
            {description}
          </Text>
          <Button 
            fullWidth 
            variant="light" 
            onClick={() => setInfoModalOpened(false)}
          >
            Got it
          </Button>
        </Modal>
      )}
    </>
  )
}