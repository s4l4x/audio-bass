import { Button, type MantineSize } from '@mantine/core'
import { IconInfoSmall as Icon } from '@tabler/icons-react'
import { useState, useEffect } from 'react'

export interface JsonViewButtonProps {
  onOpenModal: () => void
  color?: string
  size?: MantineSize
  width?: string | number
  height?: string | number
}

export function JsonViewButton({ 
  onOpenModal,
  color = "gray",
  size = "xs",
  width = 30,
  height = 30 
}: JsonViewButtonProps) {
  
  // Detect if device supports touch
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  const baseStyle = {
    outline: 'none',
    touchAction: 'none' as const,
    userSelect: 'none' as const,
    WebkitTouchCallout: 'none' as const,
    WebkitUserSelect: 'none' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    padding: 0
  }

  const handleClick = () => {
    console.log('📄 Opening JSON modal')
    onOpenModal()
  }

  return (
    <Button
      w={width}
      h={height}
      // Use onClick for desktop, onTouchStart for mobile - never both
      onClick={isTouchDevice ? undefined : handleClick}
      onTouchStart={isTouchDevice ? handleClick : undefined}
      onContextMenu={(e) => {
        e.preventDefault() // Prevent context menu
      }}
      variant="outline"
      color={color}
      size={size}
      style={baseStyle}
    >
      <Icon size={30} stroke={1.5}/>
    </Button>
  )
}