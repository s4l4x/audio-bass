import { useState, useRef, useCallback, useEffect } from 'react'
import { Box, useMantineTheme, useComputedColorScheme, Button } from '@mantine/core'
import type { ADSRSettings, CurveType } from '../hooks/useADSR'

interface GraphicalADSRProps {
  settings: ADSRSettings
  onSettingsChange: (settings: ADSRSettings) => void
  ranges?: {
    attack?: [number, number]
    decay?: [number, number]
    sustain?: [number, number]
    sustainDuration?: [number, number]
    release?: [number, number]
  }
  width?: number
  height?: number
  totalDuration?: number
  onReset?: () => void
}

interface ControlPoint {
  id: 'attack' | 'decay' | 'sustain' | 'release'
  x: number
  y: number
  isDragging: boolean
}

export function GraphicalADSR({ 
  settings, 
  onSettingsChange,
  ranges,
  width,
  height = 200,
  onReset
}: GraphicalADSRProps) {
  // Make responsive - use a state to track window size
  const [containerWidth, setContainerWidth] = useState(400)
  
  useEffect(() => {
    const updateWidth = () => {
      // Responsive width calculation
      // For mobile: much more conservative width to prevent overflow
      // For desktop: fixed 450px for optimal viewing
      const isMobile = window.innerWidth <= 768
      const maxWidth = isMobile ? Math.min(280, window.innerWidth - 120) : 450
      setContainerWidth(maxWidth)
    }
    
    if (typeof window !== 'undefined') {
      updateWidth()
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }
  }, [])
  
  const actualWidth = width || containerWidth
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light');
  const colors = theme.other.adsr.colors;
  const gridConfig = theme.other.graphGrid;
  const thumbConfig = theme.other.adsr.thumb;
  const isDark = computedColorScheme === 'dark';
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    dragId: string | null
    startPos: { x: number; y: number }
  }>({
    isDragging: false,
    dragId: null,
    startPos: { x: 0, y: 0 }
  })

  // Convert ADSR values to SVG coordinates
  const labelHeight = 20  // Space needed for labels above control points
  const padding = 15
  const topPadding = padding + labelHeight
  const graphWidth = actualWidth - padding * 2
  const graphHeight = height - topPadding - padding
  const gridSpacingY = graphHeight / 6 // 6 horizontal divisions
  
  // Track the live settings during drag for real-time duration calculation
  const [liveSettings, setLiveSettings] = useState(settings)
  
  // Use live settings during drag for real-time duration updates
  const currentSettings = dragState.isDragging ? liveSettings : settings
  const currentTotalDuration = currentSettings.attack + currentSettings.decay + currentSettings.sustainDuration + currentSettings.release
  
  // Use consistent 1-second minimum to prevent graph snapping
  const actualTotalDuration = Math.max(currentTotalDuration, 1.0)

  // Use flexible ranges with defaults
  const defaultRanges = {
    attack: [0.001, 2.0] as [number, number],
    decay: [0.001, 2.0] as [number, number],
    sustain: [0.0, 1.0] as [number, number],
    sustainDuration: [0.1, 3.0] as [number, number],
    release: [0.001, 5.0] as [number, number]
  }
  
  const actualRanges = {
    ...defaultRanges,
    ...ranges
  }
  
  const [attackMinTime, attackMaxTime] = actualRanges.attack
  const [decayMinTime, decayMaxTime] = actualRanges.decay
  const [sustainMinDuration, sustainMaxDuration] = actualRanges.sustainDuration
  const [releaseMinTime, releaseMaxTime] = actualRanges.release
  
  // Time-based positioning using current settings (live during drag)
  const attackX = padding + (currentSettings.attack / actualTotalDuration) * graphWidth
  const decayX = padding + ((currentSettings.attack + currentSettings.decay) / actualTotalDuration) * graphWidth
  const sustainX = padding + ((currentSettings.attack + currentSettings.decay + currentSettings.sustainDuration) / actualTotalDuration) * graphWidth
  const releaseX = padding + ((currentSettings.attack + currentSettings.decay + currentSettings.sustainDuration + currentSettings.release) / actualTotalDuration) * graphWidth

  // Y positions (inverted because SVG y increases downward)
  const topY = topPadding
  const sustainY = topPadding + (1 - currentSettings.sustain) * graphHeight
  const bottomY = topPadding + graphHeight

  // Control points
  const controlPoints: ControlPoint[] = [
    { id: 'attack', x: attackX, y: topY, isDragging: false },
    { id: 'decay', x: decayX, y: sustainY, isDragging: false },
    { id: 'sustain', x: sustainX, y: sustainY, isDragging: false },
    { id: 'release', x: releaseX, y: bottomY, isDragging: false }
  ]

  // Generate curved paths for each ADSR segment
  const generateCurvePath = (startX: number, startY: number, endX: number, endY: number, curveType: CurveType, steps = 20) => {
    const pathPoints: string[] = []
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = startX + (endX - startX) * t
      let y: number
      
      switch (curveType) {
        case 'exponential': {
          // All exponential curves: slow start, fast end - use 1-(1-t)^2
          const expCurve = 1 - Math.pow(1 - t, 2)
          y = startY + (endY - startY) * expCurve
          break
        }
        case 'linear':
        default: {
          y = startY + (endY - startY) * t
          break
        }
      }
      
      pathPoints.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
    }
    
    return pathPoints.join(' ')
  }


  // Handle mouse events
  const handleMouseDown = useCallback((event: React.MouseEvent, pointId: string) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragState({
      isDragging: true,
      dragId: pointId,
      startPos: { x: event.clientX - rect.left, y: event.clientY - rect.top }
    })
  }, [])

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((event: React.TouchEvent, pointId: string) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || !event.touches[0]) return

    const touch = event.touches[0]
    setDragState({
      isDragging: true,
      dragId: pointId,
      startPos: { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    })
  }, [])

  // Unified drag handling function used by both mouse and touch
  const handleDragMove = useCallback((x: number, y: number) => {
    if (!dragState.isDragging || !dragState.dragId) return

    // Convert back to ADSR values based on which point is being dragged
    const newSettings = { ...settings }
    
    // Allow dragging beyond the current graph to extend total duration
    // Calculate time based on mouse position, allowing extension
    const timeAtMouseX = ((x - padding) / graphWidth) * actualTotalDuration
    
    switch (dragState.dragId) {
      case 'attack': {
        // Attack time - X-only movement - allow extending beyond normal bounds
        const attackTime = Math.max(attackMinTime, 
          Math.min(attackMaxTime * 3, timeAtMouseX) // Allow up to 3x the normal max
        )
        newSettings.attack = attackTime
        break
      }
        
      case 'decay': {
        // Decay point can be moved freely along time axis - allow extending beyond normal bounds
        // The decay phase ends at this point, so decay duration = this time - attack time
        const decayEndTime = Math.max(settings.attack + decayMinTime, timeAtMouseX)
        const newDecayTime = Math.max(decayMinTime, 
          Math.min(decayMaxTime * 3, decayEndTime - settings.attack) // Allow up to 3x the normal max
        )
        newSettings.decay = newDecayTime
        
        // Sustain level - Y movement (decay endpoint determines sustain level)
        const decaySustainLevel = Math.max(0, Math.min(1,
          1 - ((y - topPadding) / graphHeight)
        ))
        newSettings.sustain = decaySustainLevel
        break
      }
        
      case 'sustain': {
        // Sustain level - Y movement for level
        const sustainPointLevel = Math.max(0, Math.min(1,
          1 - ((y - topPadding) / graphHeight)
        ))
        newSettings.sustain = sustainPointLevel
        
        // Sustain point can be moved freely along time axis
        // The sustain phase ends at this point, so sustain duration = this time - (attack + decay)
        const sustainStartTime = settings.attack + settings.decay
        const sustainEndTime = Math.max(sustainStartTime + sustainMinDuration, timeAtMouseX)
        const newSustainDuration = Math.max(sustainMinDuration, 
          Math.min(sustainMaxDuration * 3, sustainEndTime - sustainStartTime)
        )
        newSettings.sustainDuration = newSustainDuration
        break
      }
        
      case 'release': {
        // Release time - X-only movement - allow extending beyond current bounds
        const releaseStartTime = settings.attack + settings.decay + settings.sustainDuration
        const releaseTime = Math.max(releaseMinTime, 
          Math.min(releaseMaxTime * 3, timeAtMouseX - releaseStartTime) // Allow up to 3x the normal max
        )
        newSettings.release = releaseTime
        break
      }
    }
    
    // Update live settings for real-time duration calculation
    setLiveSettings(newSettings)
    onSettingsChange(newSettings)
  }, [dragState, settings, onSettingsChange, actualTotalDuration, graphWidth, graphHeight, padding, topPadding, attackMinTime, attackMaxTime, decayMinTime, decayMaxTime, sustainMinDuration, sustainMaxDuration, releaseMinTime, releaseMaxTime])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    handleDragMove(x, y)
  }, [handleDragMove])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault() // Prevent scrolling and other touch behaviors
    
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || !event.touches[0]) return

    const touch = event.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    handleDragMove(x, y)
  }, [handleDragMove])

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragId: null,
      startPos: { x: 0, y: 0 }
    })
  }, [])

  const handleTouchEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      dragId: null,
      startPos: { x: 0, y: 0 }
    })
  }, [])

  // Sync live settings with actual settings when not dragging
  useEffect(() => {
    if (!dragState.isDragging) {
      setLiveSettings(settings)
    }
  }, [settings, dragState.isDragging])
  
  // Add document-level event listeners when dragging
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return (
    <Box style={{ userSelect: 'none' }}>
      <Box
        style={{ 
          border: `1px solid var(--mantine-color-${isDark ? 'dark' : 'gray'}-${isDark ? '4' : '3'})`,
          borderRadius: '8px',
          padding: '4px',
          backgroundColor: `var(--mantine-color-${isDark ? 'dark' : 'gray'}-${isDark ? '6' : '0'})`,
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Reset button positioned in top-right corner */}
        {onReset && (
          <Button
            size="xs"
            variant="subtle"
            onClick={onReset}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 10,
              fontSize: '10px',
              height: '20px',
              minHeight: '20px',
              padding: '0 6px'
            }}
          >
            Reset
          </Button>
        )}
        <svg
          ref={svgRef}
          width={actualWidth}
          height={height}
          viewBox={`0 0 ${actualWidth} ${height}`}
          style={{ 
            cursor: dragState.isDragging ? 'grabbing' : 'default',
            width: '100%',
            height: 'auto',
            maxWidth: `${actualWidth}px`,
            userSelect: 'none',
            touchAction: 'none'
          }}
        >
          {/* Grid lines */}
          <g>
            {/* Time-based vertical grid lines */}
            {Array.from({ length: Math.ceil(actualTotalDuration) + 1 }, (_, i) => (
              <g key={`time-${i}`}>
                <line
                  x1={padding + (i / actualTotalDuration) * graphWidth}
                  y1={topPadding}
                  x2={padding + (i / actualTotalDuration) * graphWidth}
                  y2={topPadding + graphHeight}
                  stroke={isDark ? gridConfig.stroke.dark : gridConfig.stroke.light}
                  strokeWidth={gridConfig.stroke.width}
                  opacity={gridConfig.stroke.opacity}
                />
                {/* Time labels */}
                <text
                  x={padding + (i / actualTotalDuration) * graphWidth}
                  y={topPadding + graphHeight + 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isDark ? gridConfig.text.dark : gridConfig.text.light}
                >
                  {i}s
                </text>
              </g>
            ))}
            {/* Horizontal grid lines */}
            {Array.from({ length: 7 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1={padding}
                y1={topPadding + i * gridSpacingY}
                x2={padding + graphWidth}
                y2={topPadding + i * gridSpacingY}
                stroke={isDark ? gridConfig.stroke.dark : gridConfig.stroke.light}
                strokeWidth={gridConfig.stroke.width}
                opacity={gridConfig.stroke.opacity}
              />
            ))}
          </g>
          
          
          {/* ADSR curve segments - visual paths first */}
          {/* Attack segment - exponential curve */}
          <path
            d={generateCurvePath(padding, bottomY, attackX, topY, 'exponential')}
            fill="none"
            stroke={colors.attack}
            strokeWidth="2"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          
          {/* Decay segment - exponential curve */}
          <path
            d={generateCurvePath(attackX, topY, decayX, sustainY, 'exponential')}
            fill="none"
            stroke={colors.decay}
            strokeWidth="2"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          
          {/* Sustain segment (always linear) */}
          <path
            d={`M ${decayX} ${sustainY} L ${sustainX} ${sustainY}`}
            fill="none"
            stroke={colors.sustain}
            strokeWidth="2"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          
          {/* Release segment - exponential curve */}
          <path
            d={generateCurvePath(sustainX, sustainY, releaseX, bottomY, 'exponential')}
            fill="none"
            stroke={colors.release}
            strokeWidth="2"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          
          {/* Control points with color coding and directional cursors */}
          {controlPoints.map((point) => {
            const cursors = {
              attack: 'ew-resize',      // horizontal resize for time
              decay: 'move',            // both horizontal (time) and vertical (sustain level)
              sustain: 'move',          // both horizontal (duration) and vertical (level)
              release: 'ew-resize'      // horizontal resize for time
            }
            
            return (
              <g key={point.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={dragState.dragId === point.id ? thumbConfig.sizeActive : thumbConfig.size}
                  fill={colors[point.id]}
                  style={{ 
                    cursor: dragState.dragId === point.id ? 'grabbing' : cursors[point.id],
                    transition: 'r 150ms ease, opacity 150ms ease'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, point.id)}
                  onTouchStart={(e) => handleTouchStart(e, point.id)}
                  opacity={dragState.dragId === point.id ? 0.9 : 1}
                />
                <text
                  x={point.x}
                  y={point.y - 18}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill={isDark ? gridConfig.text.dark : gridConfig.text.light}
                  pointerEvents="none"
                >
                  {point.id.charAt(0).toUpperCase()}
                </text>
              </g>
            )
          })}
          
          
        </svg>
      </Box>
      
    </Box>
  )
}