import { Button, type MantineSize, Box, useMantineColorScheme } from '@mantine/core'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import { useState, useEffect } from 'react'

export interface PlayButtonProps {
  isPlaying: boolean
  triggerType: 'pulse' | 'sustained' // pulse = one-shot like bass kick, sustained = hold like synth
  onTrigger: () => void // For pulse type
  onPlay?: () => void // For sustained type
  onStop?: () => void // For sustained type
  color?: string
  size?: MantineSize
  width?: string | number
  height?: string | number
}

export function PlayButton({ 
  isPlaying, 
  triggerType, 
  onTrigger, 
  onPlay, 
  onStop, 
  color = "blue",
  size = "xs",
  width = 30,
  height = 30 
}: PlayButtonProps) {
  
  // Detect if device supports touch
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const { colorScheme } = useMantineColorScheme()
  
  // Create unique ID for this component's CSS
  const shimmerAnimationId = 'shimmer-playbutton-' + Math.random().toString(36).substr(2, 9)
  
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
    borderRadius: "9999px",
    padding: 0,
    position: 'relative' as const,
    overflow: 'hidden'
  }

  // Shimmer effect component
  const ShimmerEffect = () => (
    <>
      {/* CSS Animation */}
      <style>{`
      @keyframes ${shimmerAnimationId} {
        0% { 
        left: -400%; 
        }
        100% { 
        left: 400%; 
        }
      }
      `}</style>
      
      {/* Moving gradient overlay */}
      <Box
      style={{
        position: 'absolute',
        top: 0,
        left: '-400%',
        width: '800%',
        height: '100%',
        background: `linear-gradient(45deg, 
        transparent 0%, 
        transparent 10%, 
        ${colorScheme === 'dark' ? 'var(--mantine-color-dark-0)' : 'white'} 10.5%, 
        ${colorScheme === 'dark' ? 'var(--mantine-color-dark-0)' : 'white'} 13%, 
        transparent 18%, 
        transparent 100%
        )`,
        opacity: 0.2,
        animation: `${shimmerAnimationId} 2.5s infinite linear`,
        pointerEvents: 'none'
      }}
      />
    </>
  )

  // Handler functions
  const handlePulseTrigger = async () => {
    console.log('🥁 Pulse trigger - one-shot')
    onTrigger()
  }

  const handleSustainedStart = async () => {
    console.log('🎹 Sustained start - starting note')
    onPlay?.()
  }

  const handleSustainedStop = () => {
    console.log('🎹 Sustained stop - stopping note')
    onStop?.()
  }

  // Event handlers based on trigger type
  const eventHandlers = triggerType === 'pulse' 
    ? {
        // Pulse: single trigger on click/touch
        onClick: isTouchDevice ? undefined : handlePulseTrigger,
        onTouchStart: isTouchDevice ? handlePulseTrigger : undefined,
      }
    : {
        // Sustained: press/hold/release
        onMouseDown: isTouchDevice ? undefined : handleSustainedStart,
        onMouseUp: isTouchDevice ? undefined : handleSustainedStop,
        onMouseLeave: isTouchDevice ? undefined : handleSustainedStop,
        onTouchStart: isTouchDevice ? handleSustainedStart : undefined,
        onTouchEnd: isTouchDevice ? handleSustainedStop : undefined,
        onTouchCancel: isTouchDevice ? handleSustainedStop : undefined,
      }

  return (
    <Button
      w={width}
      h={height}
      {...eventHandlers}
      onContextMenu={(e) => {
        e.preventDefault() // Prevent context menu
      }}
      variant={isPlaying ? "outline" : "filled"}
      color={color}
      size={size}
      style={baseStyle}
    >
      <ShimmerEffect />
      <IconPlayerPlayFilled size={14} style={{ position: 'relative', zIndex: 1 }} />
    </Button>
  )
}