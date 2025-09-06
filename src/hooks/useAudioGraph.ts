import { useState, useCallback, useRef, useEffect } from 'react'
import { loadTone, getToneModule } from '../utils/toneLoader'
import { useAudioNodes } from './useAudioNodes'
import { useGraphConnections } from './useGraphConnections'
import { useModulationMatrix } from './useModulationMatrix'
import type { AudioGraphConfig, AudioGraphState } from '../types/audioGraph'

export function useAudioGraph(initialConfig: AudioGraphConfig) {
  const [config, setConfig] = useState<AudioGraphConfig>(initialConfig)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null)
  const graphStateRef = useRef<AudioGraphState>({
    nodes: new Map(),
    connections: [],
    isInitialized: false
  })
  
  // Flag to prevent effect loops
  const initializingRef = useRef(false)

  // Use the specialized hooks for managing different aspects
  const { 
    nodes, 
    createNode, 
    updateNodeSettings, 
    disposeNode,
    getNodeById,
    initializeNodeInstance
  } = useAudioNodes()

  const { 
    connections 
  } = useGraphConnections(nodes)

  const { 
    modulationRoutes, 
    addModulationRoute, 
    applyModulation 
  } = useModulationMatrix(nodes)

  // Generate waveform data for visualization using offline rendering
  const generateWaveformData = useCallback(async (): Promise<Float32Array | null> => {
    try {
      // Get the trigger node settings
      const triggerNodeConfig = Object.entries(config.graph.nodes)
        .find(([, nodeDef]) => nodeDef.trigger)
      
      if (!triggerNodeConfig) return null
      
      const [nodeId, nodeDefinition] = triggerNodeConfig
      
      // Get current node instance settings if available, otherwise use config
      const nodeInstance = nodes.get(nodeId)
      const configSettings = nodeDefinition.settings || {}
      const instanceSettings = nodeInstance?.settings || {}
      const settings = { ...configSettings, ...instanceSettings }
      
      console.log('🎨 Generating waveform for:', nodeDefinition.type, 'with settings:', settings)
      
      // Calculate buffer duration based on instrument type and envelope
      let bufferDuration = 1.0 // Default fallback
      
      if (nodeDefinition.type === 'MembraneSynth' && settings.envelope) {
        bufferDuration = settings.envelope.attack + settings.envelope.decay + 
                        settings.envelope.sustainDuration + settings.envelope.release + 0.1
      } else if (nodeDefinition.type === 'Synth' && settings.envelope) {
        bufferDuration = settings.envelope.attack + settings.envelope.decay + 
                        settings.envelope.sustainDuration + settings.envelope.release + 0.1
      }
      
      // Get Tone module for waveform generation
      const Tone = getToneModule()
      if (!Tone) {
        console.warn('⚠️ Cannot generate waveform - Tone.js not loaded')
        return null
      }

      // Generate waveform using Tone.Offline
      const buffer = await Tone.Offline((context: any) => {
        if (nodeDefinition.type === 'MembraneSynth') {
          // Provide safe defaults for MembraneSynth
          const membraneSettings = {
            pitchDecay: settings.pitchDecay || 0.05,
            octaves: settings.octaves || 10,
            volume: settings.volume || -6,
            oscillator: {
              type: settings.oscillatorType || settings.oscillator?.type || 'sine'
            },
            envelope: {
              attack: settings.envelope?.attack || 0.001,
              decay: settings.envelope?.decay || 0.4,
              sustain: settings.envelope?.sustain || 0.01,
              release: settings.envelope?.release || 1.4,
              attackCurve: settings.envelope?.attackCurve || 'exponential',
              decayCurve: settings.envelope?.decayCurve || 'exponential',
              releaseCurve: settings.envelope?.releaseCurve || 'exponential'
            }
          }
          
          const synth = new Tone.MembraneSynth(membraneSettings)
          
          synth.connect(context.destination)
          synth.triggerAttack('C2', 0)
          
          const releaseTime = membraneSettings.envelope.attack + membraneSettings.envelope.decay + 
                             (settings.envelope?.sustainDuration || 0.1)
          synth.triggerRelease(releaseTime)
          
        } else if (nodeDefinition.type === 'Synth') {
          // Provide safe defaults for Synth
          const synthSettings = {
            volume: settings.volume || -6,
            oscillator: {
              type: settings.oscillatorType || settings.oscillator?.type || 'sine'
            },
            envelope: {
              attack: settings.envelope?.attack || 0.01,
              decay: settings.envelope?.decay || 0.3,
              sustain: settings.envelope?.sustain || 0.3,
              release: settings.envelope?.release || 1.0,
              attackCurve: settings.envelope?.attackCurve || 'exponential',
              decayCurve: settings.envelope?.decayCurve || 'exponential',
              releaseCurve: settings.envelope?.releaseCurve || 'exponential'
            }
          }
          
          const synth = new Tone.Synth(synthSettings)
          
          synth.connect(context.destination)
          synth.triggerAttack(settings.frequency || 440, 0)
          
          const releaseTime = synthSettings.envelope.attack + synthSettings.envelope.decay + 
                             (settings.envelope?.sustainDuration || 1.0)
          synth.triggerRelease(releaseTime)
        }
      }, bufferDuration)
      
      // Convert to Float32Array for visualization
      const channelData = buffer.getChannelData(0) // Get mono channel
      const targetPoints = 2000 // Match original resolution
      const downsampleRate = Math.max(1, Math.floor(channelData.length / targetPoints))
      const downsampled = new Float32Array(Math.ceil(channelData.length / downsampleRate))
      
      for (let i = 0; i < downsampled.length; i++) {
        downsampled[i] = channelData[i * downsampleRate] || 0
      }
      
      return downsampled
      
    } catch (error) {
      console.error('❌ Error generating waveform:', error)
      return null
    }
  }, [config, nodes])

  // Initialize graph when config changes
  const initializeGraph = useCallback(async (configToUse?: AudioGraphConfig) => {
    const activeConfig = configToUse || config
    
    // Prevent multiple initializations
    if (graphStateRef.current.isInitialized) {
      console.log('⏭️ Graph already initialized, skipping:', activeConfig.name)
      return
    }
    
    console.log('🔧 Initializing audio graph (placeholders):', activeConfig.name)
    
    try {
      // Create all nodes first
      for (const [nodeId, nodeDefinition] of Object.entries(activeConfig.graph.nodes)) {
        const node = await createNode(nodeId, nodeDefinition)
        if (!node) {
          console.warn('⚠️ Failed to create node:', nodeId)
        }
      }

      console.log('🔧 All nodes created, now establishing connections...')

      // Wait for all nodes to be properly registered
      await new Promise(resolve => setTimeout(resolve, 100))

      // Skip connections during initialization - nodes will be connected during lazy initialization
      console.log('⏭️ Skipping connections during initialization - lazy nodes will connect on first use')

      // Apply modulation routes if any
      if (activeConfig.graph.modulation) {
        for (const route of activeConfig.graph.modulation) {
          addModulationRoute(route)
        }
      }

      graphStateRef.current.isInitialized = true
      console.log('✅ Audio graph initialized successfully')
      
      // Don't generate waveform data immediately - wait for first user interaction
      // This avoids AudioContext warnings on page load
      
    } catch (error) {
      console.error('❌ Failed to initialize audio graph:', error)
    }
  }, [config, createNode, addModulationRoute])

  // Handle config changes with proper cleanup
  useEffect(() => {
    if (initialConfig !== config && !initializingRef.current) {
      initializingRef.current = true
      
      console.log('🔄 Config changed, updating graph:', initialConfig.name)
      
      // Release any currently playing audio before cleanup
      if (isPlaying) {
        console.log('🔇 Stopping current playback before config change')
        // Directly release any active synthesizers
        const currentTriggerNodes = Object.entries(config.graph.nodes)
          .filter(([, nodeDef]) => nodeDef.trigger)
          .map(([nodeId]) => nodeId)

        for (const nodeId of currentTriggerNodes) {
          const node = getNodeById(nodeId)
          if (node && node.instance && 'triggerRelease' in node.instance) {
            console.log('🔇 Pre-cleanup release:', nodeId)
            const toneNode = node.instance // as Tone.Synth | Tone.MembraneSynth
            toneNode.triggerRelease()
          }
        }
        setIsPlaying(false)
      }
      
      // Cleanup existing nodes
      for (const [nodeId] of nodes) {
        disposeNode(nodeId)
      }
      
      // Update config and reset state
      setConfig(initialConfig)
      graphStateRef.current.isInitialized = false
      
      // Initialize after cleanup with the new config
      setTimeout(async () => {
        // Wait a bit more to ensure state has settled
        await new Promise(resolve => setTimeout(resolve, 50))
        await initializeGraph(initialConfig)
        initializingRef.current = false
      }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConfig]) // Only respond to config prop changes - other deps cause infinite loop

  // Ensure initialization runs on mount
  useEffect(() => {
    if (!graphStateRef.current.isInitialized && !initializingRef.current) {
      console.log('🚀 Initial graph setup on mount')
      initializingRef.current = true
      
      setTimeout(() => {
        initializeGraph().finally(() => {
          initializingRef.current = false
        })
      }, 50)
    }
  }, [initializeGraph])

  // Generate waveform data when settings change (separate from initialization)
  useEffect(() => {
    if (graphStateRef.current.isInitialized) {
      const generateWaveform = async () => {
        const newWaveformData = await generateWaveformData()
        setWaveformData(newWaveformData)
      }
      
      // Small delay to ensure any settings updates are complete
      const timer = setTimeout(generateWaveform, 100)
      return () => clearTimeout(timer)
    }
  }, [config, generateWaveformData])

  // Update graph configuration
  const updateConfig = useCallback((newConfig: Partial<AudioGraphConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Update node settings within the graph
  const updateNodeInGraph = useCallback((nodeId: string, settings: Record<string, unknown>) => {
    updateNodeSettings(nodeId, settings)
    
    // Apply any modulation that might affect this node
    applyModulation(nodeId)
    
    // Regenerate waveform data when settings change
    generateWaveformData().then(newWaveformData => {
      setWaveformData(newWaveformData)
    })
  }, [updateNodeSettings, applyModulation, generateWaveformData])

  // Trigger the graph (start playback)
  const triggerGraph = useCallback(async (note?: string | number) => {
    console.log('🎵 triggerGraph called, initialized:', graphStateRef.current.isInitialized)
    
    // Load Tone.js first
    console.log('📦 Loading Tone.js...')
    const Tone = await loadTone()
    
    // Check if AudioContext is running (might have been started by PlayButton)
    if (Tone.getContext().state !== 'running') {
      console.log('🔊 AudioContext not running, attempting to start...')
      try {
        await Tone.start()
        console.log('✅ AudioContext started:', Tone.getContext().state)
      } catch (error) {
        console.error('❌ Failed to start AudioContext:', error)
        console.log('⚠️ Note: AudioContext should be started by user gesture in PlayButton')
        return
      }
    } else {
      console.log('✅ AudioContext already running:', Tone.getContext().state)
    }
    
    // Generate waveform data in background if needed
    if (!waveformData) {
      console.log('🎨 Generating waveform data after AudioContext start...')
      setTimeout(async () => {
        const initialWaveformData = await generateWaveformData()
        setWaveformData(initialWaveformData)
        console.log('✅ Waveform data generated')
      }, 50)
    }

    // Wait a bit for initialization if needed
    let waitCount = 0
    while (!graphStateRef.current.isInitialized && waitCount < 10) {
      console.log(`⏳ Waiting for graph initialization... (${waitCount + 1}/10)`)
      await new Promise(resolve => setTimeout(resolve, 100))
      waitCount++
    }

    if (!graphStateRef.current.isInitialized) {
      console.warn('⚠️ Cannot trigger - graph not initialized after waiting')
      return
    }

    console.log('🎵 Graph is ready, triggering nodes...')

    // Find trigger nodes (nodes marked as triggers in the config)
    const triggerNodes = Object.entries(config.graph.nodes)
      .filter(([, nodeDef]) => nodeDef.trigger)
      .map(([nodeId]) => nodeId)

    console.log('🎵 Found trigger nodes:', triggerNodes)

    // Trigger all trigger nodes
    for (const nodeId of triggerNodes) {
      const node = getNodeById(nodeId)
      console.log('🎵 Node for', nodeId, ':', !!node, 'initialized:', node?.instance !== null)
      
      if (!node) {
        console.warn('⚠️ Node not found:', nodeId)
        continue
      }

      // Lazy initialize the node's Tone.js instance
      if (node.instance === null) {
        console.log('🔧 Lazy initializing node:', nodeId)
        const initialized = await initializeNodeInstance(node)
        if (!initialized) {
          console.warn('⚠️ Failed to initialize node:', nodeId)
          continue
        }
      }
      
      if (node.instance && 'triggerAttackRelease' in node.instance) {
        const toneNode = node.instance // as Tone.Synth | Tone.MembraneSynth
        console.log('🎵 Trigger mode detected:', config.graph.trigger)
        
        if (config.graph.trigger === 'momentary') {
          // For bass kick style - one shot trigger
          console.log('🥁 Triggering bass kick:', note || 'C2')
          toneNode.triggerAttackRelease(note || 'C2', '8n')
          setIsPlaying(true)
          setTimeout(() => setIsPlaying(false), 150)
        } else {
          // For synth style - sustained note
          // Release any currently playing note first to prevent overlapping
          if ('triggerRelease' in toneNode && isPlaying) {
            console.log('🎹 Releasing current note before new attack')
            toneNode.triggerRelease()
          }
          
          // Use the current frequency setting from the node
          const currentFrequency = node.settings.frequency || 440
          const noteToPlay = note || currentFrequency
          console.log('🎹 Triggering sustained note (triggerAttack):', noteToPlay)
          toneNode.triggerAttack(noteToPlay)
          setIsPlaying(true)
          
          // Regenerate waveform data after triggering
          setTimeout(async () => {
            const newWaveformData = await generateWaveformData()
            setWaveformData(newWaveformData)
          }, 100)
        }
      } else {
        console.warn('⚠️ Node not triggerable:', nodeId)
      }
    }
  }, [config, getNodeById, waveformData, generateWaveformData, initializeNodeInstance])

  // Release the graph (stop playbook for sustained notes)
  const releaseGraph = useCallback(() => {
    console.log('🛑 releaseGraph called')
    
    // Always attempt to stop any playing audio, regardless of initialization state
    // This fixes the race condition where config changes clear isInitialized but we still need to stop audio
    if (!isPlaying) {
      console.log('⏭️ Skipping release - not playing')
      return
    }
    
    // Try to release using current nodes first (most reliable)
    let releasedAnyNode = false
    const triggerNodes = Object.entries(config.graph.nodes)
      .filter(([, nodeDef]) => nodeDef.trigger)
      .map(([nodeId]) => nodeId)

    for (const nodeId of triggerNodes) {
      const node = getNodeById(nodeId)
      if (node && node.instance && 'triggerRelease' in node.instance) {
        console.log('🔇 Releasing node:', nodeId)
        const toneNode = node.instance // as Tone.Synth | Tone.MembraneSynth
        toneNode.triggerRelease()
        releasedAnyNode = true
      } else {
        console.warn('⚠️ Cannot release node:', nodeId, 'Node exists:', !!node, 'Has instance:', node?.instance !== null, 'Has triggerRelease:', node?.instance && 'triggerRelease' in node.instance)
      }
    }

    // Fallback: if we couldn't release through the graph system, 
    // force stop all Tone.js synthesizers as a safety measure
    if (!releasedAnyNode) {
      console.log('🛑 Fallback: Attempting to stop any remaining audio')
      try {
        // As a last resort, try to stop the Tone.js transport
        // This is less precise but can help stop stuck audio
        const Tone = getToneModule()
        if (Tone && Tone.Transport.state === 'started') {
          Tone.Transport.stop()
        }
        // Also cancel any scheduled events
        if (Tone) {
          Tone.Transport.cancel()
        }
      } catch (error) {
        console.warn('⚠️ Error during fallback release:', error)
      }
    }
    
    setIsPlaying(false)
  }, [config, getNodeById, isPlaying])

  // Get waveform data for visualization
  const getWaveformData = useCallback((): Float32Array | null => {
    return waveformData
  }, [waveformData])

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up audio graph')
    
    // Dispose all nodes
    for (const [nodeId] of nodes) {
      disposeNode(nodeId)
    }
    
    // Clear state
    graphStateRef.current = {
      nodes: new Map(),
      connections: [],
      isInitialized: false
    }
    
    setIsPlaying(false)
  }, [nodes, disposeNode])

  return {
    config,
    isPlaying,
    nodes,
    connections,
    modulationRoutes,
    updateConfig,
    updateNodeInGraph,
    initializeGraph,
    triggerGraph,
    releaseGraph,
    getWaveformData,
    cleanup
  }
}