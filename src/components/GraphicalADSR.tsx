import { useState, useRef, useCallback } from 'react'
import { Box, useMantineTheme, useComputedColorScheme } from '@mantine/core'
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
  width = 400,
  height = 200 
}: GraphicalADSRProps) {
  const textSpace = 15 // Extra space for the total duration text
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
  const graphWidth = width - padding * 2
  const graphHeight = height - topPadding - padding
  const gridSpacingX = graphWidth / 8  // 8 vertical divisions
  const gridSpacingY = graphHeight / 6 // 6 horizontal divisions

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
  
  const attackX = padding + (settings.attack / attackMaxTime) * (graphWidth * 0.2) // 20% of width for attack
  const decayX = attackX + (settings.decay / decayMaxTime) * (graphWidth * 0.2)   // 20% of width for decay  
  const sustainX = decayX + (settings.sustainDuration / sustainMaxDuration) * (graphWidth * 0.4)  // 40% of width for sustain
  const releaseX = sustainX + (settings.release / releaseMaxTime) * (graphWidth * 0.2) // 20% of width for release

  // Y positions (inverted because SVG y increases downward)
  const topY = topPadding
  const sustainY = topPadding + (1 - settings.sustain) * graphHeight
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
      let x = startX + (endX - startX) * t
      let y: number
      
      switch (curveType) {
        case 'exponential':
          // All exponential curves: slow start, fast end - use 1-(1-t)^2
          const expCurve = 1 - Math.pow(1 - t, 2)
          y = startY + (endY - startY) * expCurve
          break
        case 'sine':
          const sineCurve = Math.sin(t * Math.PI * 0.5)
          y = startY + (endY - startY) * sineCurve
          break
        case 'cosine':
          const cosineCurve = 1 - Math.cos(t * Math.PI * 0.5)
          y = startY + (endY - startY) * cosineCurve
          break
        case 'linear':
        default:
          y = startY + (endY - startY) * t
          break
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

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.dragId) return
    
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert back to ADSR values based on which point is being dragged
    const newSettings = { ...settings }
    
    switch (dragState.dragId) {
      case 'attack':
        // Attack time - X-only movement
        const attackTime = Math.max(attackMinTime, Math.min(attackMaxTime, 
          ((x - padding) / (graphWidth * 0.2)) * attackMaxTime
        ))
        newSettings.attack = attackTime
        break
        
      case 'decay':
        // Decay time - X movement for duration
        const decayTime = Math.max(decayMinTime, Math.min(decayMaxTime,
          ((x - attackX) / (graphWidth * 0.2)) * decayMaxTime
        ))
        newSettings.decay = decayTime
        
        // Sustain level - Y movement (decay endpoint determines sustain level)
        const decaySustainLevel = Math.max(0, Math.min(1,
          1 - ((y - topPadding) / graphHeight)
        ))
        newSettings.sustain = decaySustainLevel
        break
        
      case 'sustain':
        // Sustain level - Y movement for level
        const sustainPointLevel = Math.max(0, Math.min(1,
          1 - ((y - topPadding) / graphHeight)
        ))
        newSettings.sustain = sustainPointLevel
        
        // Sustain duration - X movement for duration
        const sustainDurationTime = Math.max(sustainMinDuration, Math.min(sustainMaxDuration,
          ((x - decayX) / (graphWidth * 0.4)) * sustainMaxDuration
        ))
        newSettings.sustainDuration = sustainDurationTime
        break
        
      case 'release':
        // Release time - X-only movement, independent calculation
        const releaseTime = Math.max(releaseMinTime, Math.min(releaseMaxTime,
          ((x - sustainX) / (graphWidth * 0.2)) * releaseMaxTime
        ))
        newSettings.release = releaseTime
        break
    }
    
    onSettingsChange(newSettings)
  }, [dragState, settings, onSettingsChange, attackX, sustainX, decayX, graphWidth, graphHeight, padding, topPadding, attackMinTime, attackMaxTime, decayMinTime, decayMaxTime, sustainMinDuration, sustainMaxDuration, releaseMinTime, releaseMaxTime])

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragId: null,
      startPos: { x: 0, y: 0 }
    })
  }, [])

  return (
    <Box style={{ userSelect: 'none' }}>
      <Box
        style={{ 
          border: `1px solid var(--mantine-color-${isDark ? 'dark' : 'gray'}-${isDark ? '4' : '3'})`,
          borderRadius: '8px',
          padding: '8px',
          backgroundColor: `var(--mantine-color-${isDark ? 'dark' : 'gray'}-${isDark ? '6' : '0'})`
        }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height + textSpace}
          style={{ 
            cursor: dragState.isDragging ? 'grabbing' : 'default',
            userSelect: 'none'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid lines */}
          <g>
            {/* Vertical grid lines */}
            {Array.from({ length: 9 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={padding + i * gridSpacingX}
                y1={topPadding}
                x2={padding + i * gridSpacingX}
                y2={topPadding + graphHeight}
                stroke={isDark ? gridConfig.stroke.dark : gridConfig.stroke.light}
                strokeWidth={gridConfig.stroke.width}
                opacity={gridConfig.stroke.opacity}
              />
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
          
          {/* Total ADSR duration below R point */}
          <text
            x={releaseX}
            y={topPadding + graphHeight + 20}
            textAnchor="middle"
            fontSize="10"
            fontWeight="500"
            fill={isDark ? gridConfig.text.dark : gridConfig.text.light}
          >
            {(settings.attack + settings.decay + settings.sustainDuration + settings.release).toFixed(2)}s
          </text>
          
        </svg>
      </Box>
      
    </Box>
  )
}