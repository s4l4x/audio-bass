import { Button } from '@mantine/core'
import { IconPlayerPlayFilled } from '@tabler/icons-react'

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
    return (
      <Button
        w={width}
        h={height}
        onTouchStart={async (e) => {
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
        }}
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
  return (
    <Button
      w={width}
      h={height}
      onTouchStart={async (e) => {
        console.log('🎹 Sustained touch start - starting note')
        
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
      }}
      onTouchEnd={(e) => {
        console.log('🎹 Sustained touch end - stopping note')
        onStop?.()
      }}
      onTouchCancel={(e) => {
        console.log('🎹 Sustained touch cancel - stopping note')
        onStop?.()
      }}
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