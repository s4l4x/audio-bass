import { useEffect, useState } from 'react'
import { Box, useMantineTheme, useComputedColorScheme } from '@mantine/core'

interface WaveformVisualizationProps {
  getWaveformData?: () => Float32Array | null
  width?: number
  height?: number
  isGenerating?: boolean
  totalDuration?: number
}

export function WaveformVisualization({
  getWaveformData,
  width = 400,
  height = 120,
  isGenerating = false,
  totalDuration = 5.0
}: WaveformVisualizationProps) {
  const theme = useMantineTheme()
  const computedColorScheme = useComputedColorScheme('light')
  const gridConfig = theme.other.graphGrid
  const isDark = computedColorScheme === 'dark'
  const [waveformPath, setWaveformPath] = useState('')
  const [lastDataLength, setLastDataLength] = useState(0)

  const padding = 15
  const graphWidth = width - padding * 2
  const graphHeight = height - padding * 2

  const updateWaveform = () => {
    if (!getWaveformData || typeof getWaveformData !== 'function') {
      return
    }
    
    const waveformData = getWaveformData()
    if (!waveformData || waveformData.length === 0) {
      return
    }

    setLastDataLength(waveformData.length)

    // Convert waveform data to SVG path with time-based positioning
    const centerY = padding + graphHeight / 2
    const pathCommands: string[] = []

    for (let i = 0; i < waveformData.length; i++) {
      // Position based on actual time rather than sample index
      const timeRatio = i / (waveformData.length - 1) // 0 to 1
      const actualTime = timeRatio * totalDuration // 0 to totalDuration seconds
      const x = padding + (actualTime / totalDuration) * graphWidth
      const y = centerY - (waveformData[i] * graphHeight * 0.4) // Scale amplitude
      
      if (i === 0) {
        pathCommands.push(`M ${x} ${y}`)
      } else {
        pathCommands.push(`L ${x} ${y}`)
      }
    }

    setWaveformPath(pathCommands.join(' '))
  }

  // Update waveform immediately when new data becomes available
  useEffect(() => {
    updateWaveform()
  }, [getWaveformData])

  // Also update when getWaveformData function changes (new data available)
  useEffect(() => {
    if (!getWaveformData || typeof getWaveformData !== 'function') {
      return
    }
    
    // Check for new data periodically but less frequently (for live recording)
    const interval = setInterval(updateWaveform, 1000)
    
    return () => clearInterval(interval)
  }, [getWaveformData])

  return (
    <Box
      style={{
        border: `1px solid var(--mantine-color-${isDark ? 'dark' : 'gray'}-${isDark ? '4' : '3'})`,
        borderRadius: '8px',
        padding: '8px',
        backgroundColor: `var(--mantine-color-${isDark ? 'dark' : 'gray'}-${isDark ? '6' : '0'})`
      }}
    >
      <svg
        width={width}
        height={height + 20}
        style={{
          userSelect: 'none'
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
          {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
            <g key={`time-${i}`}>
              <line
                x1={padding + (i / totalDuration) * graphWidth}
                y1={padding}
                x2={padding + (i / totalDuration) * graphWidth}
                y2={padding + graphHeight}
                stroke={isDark ? gridConfig.stroke.dark : gridConfig.stroke.light}
                strokeWidth={gridConfig.stroke.width}
                opacity={gridConfig.stroke.opacity}
              />
              {/* Time labels */}
              <text
                x={padding + (i / totalDuration) * graphWidth}
                y={padding + graphHeight + 15}
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
            x={width / 2}
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