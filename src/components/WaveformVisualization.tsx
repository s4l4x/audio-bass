import { useEffect, useState, useCallback } from 'react'
import { Box, useMantineTheme, useComputedColorScheme } from '@mantine/core'

interface WaveformVisualizationProps {
  getWaveformData?: () => Float32Array | null
  width?: number
  height?: number
  isGenerating?: boolean
  totalDuration?: number
  adsrSettings?: { attack: number; decay: number; sustainDuration: number; release: number }
}

export function WaveformVisualization({
  getWaveformData,
  width,
  height = 120,
  isGenerating = false,
  totalDuration = 5.0,
  adsrSettings
}: WaveformVisualizationProps) {
  // Make responsive - use a state to track window size
  const [containerWidth, setContainerWidth] = useState(400)
  
  useEffect(() => {
    const updateWidth = () => {
      // Simple responsive logic: fill available width with padding, max 600px
      const availableWidth = window.innerWidth - 80 // 40px padding on each side
      const maxWidth = Math.min(600, availableWidth)
      setContainerWidth(maxWidth)
    }
    
    if (typeof window !== 'undefined') {
      updateWidth()
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }
  }, [])
  
  const actualWidth = width || containerWidth
  
  const theme = useMantineTheme()
  const computedColorScheme = useComputedColorScheme('light')
  const gridConfig = theme.other.graphGrid
  const isDark = computedColorScheme === 'dark'
  const [waveformPath, setWaveformPath] = useState('')

  const padding = 15
  const graphWidth = actualWidth - padding * 2
  const graphHeight = height - padding * 2
  
  // Calculate actual duration from ADSR settings if provided, otherwise use totalDuration
  // Use 1-second minimum to match ADSR graph and prevent snapping
  const calculatedDuration = adsrSettings 
    ? adsrSettings.attack + adsrSettings.decay + adsrSettings.sustainDuration + adsrSettings.release
    : totalDuration
  const actualDuration = Math.max(calculatedDuration, 1.0)

  const updateWaveform = useCallback(() => {
    if (!getWaveformData || typeof getWaveformData !== 'function') {
      return
    }
    
    const waveformData = getWaveformData()
    if (!waveformData || waveformData.length === 0) {
      return
    }


    // Convert waveform data to SVG path with time-based positioning
    const centerY = padding + graphHeight / 2
    const pathCommands: string[] = []

    for (let i = 0; i < waveformData.length; i++) {
      // Position based on actual time rather than sample index
      const timeRatio = i / (waveformData.length - 1) // 0 to 1
      const actualTime = timeRatio * actualDuration // 0 to actualDuration seconds
      const x = padding + (actualTime / actualDuration) * graphWidth
      const y = centerY - (waveformData[i] * graphHeight * 0.4) // Scale amplitude
      
      if (i === 0) {
        pathCommands.push(`M ${x} ${y}`)
      } else {
        pathCommands.push(`L ${x} ${y}`)
      }
    }

    setWaveformPath(pathCommands.join(' '))
  }, [getWaveformData, actualDuration, padding, graphHeight, graphWidth])

  // Update waveform immediately when new data becomes available or duration changes
  useEffect(() => {
    updateWaveform()
  }, [updateWaveform])

  // Also update when getWaveformData function changes (new data available)
  useEffect(() => {
    if (!getWaveformData || typeof getWaveformData !== 'function') {
      return
    }
    
    // Check for new data periodically but less frequently (for live recording)
    const interval = setInterval(updateWaveform, 1000)
    
    return () => clearInterval(interval)
  }, [updateWaveform, getWaveformData])

  return (
    <Box
      style={{
        border: `1px solid var(--mantine-color-${isDark ? 'dark' : 'gray'}-${isDark ? '4' : '3'})`,
        borderRadius: '8px',
        padding: '4px',
        backgroundColor: `var(--mantine-color-${isDark ? 'dark' : 'gray'}-${isDark ? '6' : '0'})`,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <svg
        width={actualWidth}
        height={height}
        viewBox={`0 0 ${actualWidth} ${height}`}
        style={{
          userSelect: 'none',
          width: '100%',
          height: 'auto',
          maxWidth: `${actualWidth}px`
        }}
      >
        {/* Grid lines */}
        <g>
          {/* Horizontal center line */}
          <line
            x1={padding}
            y1={padding + graphHeight / 2}
            x2={padding + graphWidth}
            y2={padding + graphHeight / 2}
            stroke={isDark ? gridConfig.stroke.dark : gridConfig.stroke.light}
            strokeWidth={gridConfig.stroke.width}
            strokeDasharray="2,2"
            opacity="0.5"
          />
          
          {/* Time-based vertical grid lines */}
          {Array.from({ length: Math.ceil(actualDuration) + 1 }, (_, i) => (
            <g key={`time-${i}`}>
              <line
                x1={padding + (i / actualDuration) * graphWidth}
                y1={padding}
                x2={padding + (i / actualDuration) * graphWidth}
                y2={padding + graphHeight}
                stroke={isDark ? gridConfig.stroke.dark : gridConfig.stroke.light}
                strokeWidth={gridConfig.stroke.width}
                opacity={gridConfig.stroke.opacity}
              />
              {/* Time labels */}
              <text
                x={padding + (i / actualDuration) * graphWidth}
                y={padding + graphHeight + 10}
                textAnchor="middle"
                fontSize="10"
                fill={isDark ? gridConfig.text.dark : gridConfig.text.light}
              >
                {i}s
              </text>
            </g>
          ))}
        </g>

        {/* Waveform path */}
        {waveformPath && (
          <path
            d={waveformPath}
            fill="none"
            stroke={isDark ? 'var(--mantine-color-blue-4)' : 'var(--mantine-color-blue-6)'}
            strokeWidth="1"
            strokeLinejoin="round"
            opacity={isGenerating ? 0.5 : 1}
          />
        )}
        
        {/* Loading indicator */}
        {isGenerating && (
          <text
            x={actualWidth / 2}
            y={height / 2}
            textAnchor="middle"
            fontSize="12"
            fill={isDark ? gridConfig.text.dark : gridConfig.text.light}
            opacity="0.7"
          >
            Updating...
          </text>
        )}
      </svg>
    </Box>
  )
}