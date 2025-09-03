import { useState, useRef, useCallback } from 'react'
import { Box, Text, Group, useMantineTheme } from '@mantine/core'
import type { ADSRSettings, CurveType } from '../hooks/useADSR'

interface GraphicalADSRProps {
  settings: ADSRSettings
  onSettingsChange: (settings: ADSRSettings) => void
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
  width = 400,
  height = 200 
}: GraphicalADSRProps) {
  const theme = useMantineTheme();
  const colors = theme.other.adsrColors;
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
  const padding = 25
  const graphWidth = width - padding * 2
  const graphHeight = height - padding * 2

  // Fixed proportional layout for consistent interaction
  const attackX = padding + (settings.attack / 2.0) * (graphWidth * 0.25) // 25% of width for attack
  const decayX = attackX + (settings.decay / 2.0) * (graphWidth * 0.25)   // 25% of width for decay  
  const sustainX = padding + graphWidth * 0.5                               // Fixed at 50% for sustain display
  const releaseX = sustainX + (settings.release / 5.0) * (graphWidth * 0.5) // 50% of width for release

  // Y positions (inverted because SVG y increases downward)
  const topY = padding
  const sustainY = padding + (1 - settings.sustain) * graphHeight
  const bottomY = padding + graphHeight

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
        const attackTime = Math.max(0.001, Math.min(2.0, 
          ((x - padding) / (graphWidth * 0.25)) * 2.0
        ))
        newSettings.attack = attackTime
        break
        
      case 'decay':
        // Decay time - X-only movement
        const decayTime = Math.max(0.001, Math.min(2.0,
          ((x - attackX) / (graphWidth * 0.25)) * 2.0
        ))
        newSettings.decay = decayTime
        break
        
      case 'sustain':
        // Sustain level - Y-only movement
        const sustainLevel = Math.max(0, Math.min(1,
          1 - ((y - padding) / graphHeight)
        ))
        newSettings.sustain = sustainLevel
        break
        
      case 'release':
        // Release time - X-only movement, independent calculation
        const releaseTime = Math.max(0.001, Math.min(5.0,
          ((x - sustainX) / (graphWidth * 0.5)) * 5.0
        ))
        newSettings.release = releaseTime
        break
    }
    
    onSettingsChange(newSettings)
  }, [dragState, settings, onSettingsChange, attackX, sustainX, graphWidth, graphHeight, padding])

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
          border: '1px solid var(--mantine-color-gray-3)',
          borderRadius: '8px',
          padding: '8px',
          backgroundColor: 'var(--mantine-color-gray-0)'
        }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ 
            cursor: dragState.isDragging ? 'grabbing' : 'default',
            userSelect: 'none'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e9ecef" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" />
          
          {/* Drag constraint guides */}
          {dragState.isDragging && dragState.dragId && (
            <>
              {(dragState.dragId === 'attack' || dragState.dragId === 'decay' || dragState.dragId === 'release') && (
                <line
                  x1={padding}
                  y1={controlPoints.find(p => p.id === dragState.dragId)?.y}
                  x2={width - padding}
                  y2={controlPoints.find(p => p.id === dragState.dragId)?.y}
                  stroke="#868e96"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.5"
                />
              )}
              {dragState.dragId === 'sustain' && (
                <line
                  x1={controlPoints.find(p => p.id === 'sustain')?.x}
                  y1={padding}
                  x2={controlPoints.find(p => p.id === 'sustain')?.x}
                  y2={height - padding}
                  stroke="#868e96"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.5"
                />
              )}
            </>
          )}
          
          {/* ADSR curve segments - visual paths first */}
          {/* Attack segment - exponential curve */}
          <path
            d={generateCurvePath(padding, bottomY, attackX, topY, 'exponential')}
            fill="none"
            stroke={colors.attack}
            strokeWidth="3"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          
          {/* Decay segment - exponential curve */}
          <path
            d={generateCurvePath(attackX, topY, decayX, sustainY, 'exponential')}
            fill="none"
            stroke={colors.decay}
            strokeWidth="3"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          
          {/* Sustain segment (always linear) */}
          <path
            d={`M ${decayX} ${sustainY} L ${sustainX} ${sustainY}`}
            fill="none"
            stroke={colors.sustain}
            strokeWidth="3"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          
          {/* Release segment - exponential curve */}
          <path
            d={generateCurvePath(sustainX, sustainY, releaseX, bottomY, 'exponential')}
            fill="none"
            stroke={colors.release}
            strokeWidth="3"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          
          {/* Control points with color coding and directional cursors */}
          {controlPoints.map((point) => {
            const cursors = {
              attack: 'ew-resize',      // horizontal resize for time
              decay: 'ew-resize',       // horizontal resize for time
              sustain: 'ns-resize',     // vertical resize for level
              release: 'ew-resize'      // horizontal resize for time
            }
            
            return (
              <g key={point.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="10"
                  fill={colors[point.id]}
                  stroke="white"
                  strokeWidth="3"
                  style={{ 
                    cursor: dragState.dragId === point.id ? 'grabbing' : cursors[point.id]
                  }}
                  onMouseDown={(e) => handleMouseDown(e, point.id)}
                  opacity={dragState.dragId === point.id ? 0.8 : 1}
                />
                <text
                  x={point.x}
                  y={point.y - 18}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#495057"
                  pointerEvents="none"
                >
                  {point.id.charAt(0).toUpperCase()}
                </text>
              </g>
            )
          })}
          
          
          {/* Labels */}
          <text x={padding} y={height - 5} fontSize="10" fill="#868e96">0</text>
          <text x={width - padding} y={height - 5} fontSize="10" fill="#868e96">Time</text>
          <text x={5} y={padding + 5} fontSize="10" fill="#868e96">1</text>
          <text x={5} y={height - padding} fontSize="10" fill="#868e96">0</text>
        </svg>
      </Box>
      
      {/* Current values display with color coding */}
      <Group gap="lg" mt="xs">
        <Text size="xs" style={{ color: colors.attack }}>
          A: {settings.attack.toFixed(3)}s
        </Text>
        <Text size="xs" style={{ color: colors.decay }}>
          D: {settings.decay.toFixed(3)}s
        </Text>
        <Text size="xs" style={{ color: colors.sustain }}>
          S: {settings.sustain.toFixed(2)}
        </Text>
        <Text size="xs" style={{ color: colors.release }}>
          R: {settings.release.toFixed(3)}s
        </Text>
      </Group>
      
      {/* Interaction hint */}
      <Text size="xs" c="dimmed" ta="center" mt="xs">
        Drag points to adjust timing/level
      </Text>
    </Box>
  )
}