import { Button } from '@mantine/core'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import { useState, useEffect } from 'react'

export interface PlayButtonProps {
  isPlaying: boolean
  triggerType: 'pulse' | 'sustained' // pulse = one-shot like bass kick, sustained = hold like synth
  onTrigger: () => void // For pulse type
  onPlay?: () => void // For sustained type
  onStop?: () => void // For sustained type
  color?: string
  size?: string | number
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
    padding: 0
  }

  // Pulse type (bass kick) - single trigger
  if (triggerType === 'pulse') {
    const handlePulseTrigger = async () => {
      console.log('🥁 Pulse trigger - one-shot')
      
      // Start audio context synchronously within user gesture
      try {
        const { loadTone } = await import('../utils/toneLoader')
        const Tone = await loadTone()
        if (Tone.getContext().state !== 'running') {
          console.log('🔊 Starting AudioContext synchronously...')
          await Tone.start()
        }
      } catch (error) {
        console.warn('⚠️ Could not start AudioContext:', error)
      }
      
      onTrigger()
    }

    return (
      <Button
        w={width}
        h={height}
        // Use onClick for desktop, onTouchStart for mobile - never both
        onClick={isTouchDevice ? undefined : handlePulseTrigger}
        onTouchStart={isTouchDevice ? handlePulseTrigger : undefined}
        onContextMenu={(e) => {
          e.preventDefault() // Prevent context menu
        }}
        variant={isPlaying ? "filled" : "outline"}
        color={color}
        size={size}
        style={baseStyle}
      >
        <IconPlayerPlayFilled size={12} />
      </Button>
    )
  }

  // Sustained type (synth) - press/hold/release
  const handleSustainedStart = async () => {
    console.log('🎹 Sustained start - starting note')
    
    // Start audio context synchronously within user gesture
    try {
      const { loadTone } = await import('../utils/toneLoader')
      const Tone = await loadTone()
      if (Tone.getContext().state !== 'running') {
        console.log('🔊 Starting AudioContext synchronously...')
        await Tone.start()
      }
    } catch (error) {
      console.warn('⚠️ Could not start AudioContext:', error)
    }
    
    onPlay?.()
  }

  const handleSustainedStop = () => {
    console.log('🎹 Sustained stop - stopping note')
    onStop?.()
  }

  return (
    <Button
      w={width}
      h={height}
      // Desktop: use mouse events, Mobile: use touch events - never both
      onMouseDown={isTouchDevice ? undefined : handleSustainedStart}
      onMouseUp={isTouchDevice ? undefined : handleSustainedStop}
      onMouseLeave={isTouchDevice ? undefined : handleSustainedStop}
      onTouchStart={isTouchDevice ? handleSustainedStart : undefined}
      onTouchEnd={isTouchDevice ? handleSustainedStop : undefined}
      onTouchCancel={isTouchDevice ? handleSustainedStop : undefined}
      onContextMenu={(e) => {
        e.preventDefault() // Prevent context menu entirely
      }}
      variant={isPlaying ? "filled" : "outline"}
      color={color}
      size={size}
      style={baseStyle}
    >
      <IconPlayerPlayFilled size={12} />
    </Button>
  )
}