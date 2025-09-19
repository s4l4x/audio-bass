import { useState, useCallback, useRef, useEffect } from 'react'
import { useImmer } from 'use-immer'
import { getToneModule } from '../utils/toneLoader'
import { useAudioNodes } from './useAudioNodes'
import { useGraphConnections } from './useGraphConnections'
import { useModulationMatrix } from './useModulationMatrix'
import type { AudioGraphConfig, AudioGraphState, NodeInstance } from '../types/audioGraph'

export function useAudioGraph(initialConfig: AudioGraphConfig | null) {
  const [config, updateConfig] = useImmer<AudioGraphConfig | null>(initialConfig)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null)
  const [isGraphInitialized, setIsGraphInitialized] = useState(false)
  const graphStateRef = useRef<AudioGraphState>({
    nodes: new Map(),
    connections: [],
    isInitialized: false
  })
  
  // Flag to prevent effect loops
  const initializingRef = useRef(false)
  
  // Refs to store current state for waveform generation
  const currentConfigRef = useRef<AudioGraphConfig | null>(config)
  const currentNodesRef = useRef<Map<string, NodeInstance>>(new Map())

  // Use the specialized hooks for managing different aspects (always call hooks)
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

  // Update refs when state changes
  useEffect(() => {
    currentConfigRef.current = config
  }, [config])
  
  useEffect(() => {
    currentNodesRef.current = nodes
  }, [nodes])

  // Generate waveform data for visualization using offline rendering
  const generateWaveformData = useCallback(async (): Promise<Float32Array | null> => {
    const currentConfig = currentConfigRef.current
    const currentNodes = currentNodesRef.current
    
    if (!currentConfig) return null
    
    try {
      // Get the trigger node settings
      const triggerNodeConfig = Object.entries(currentConfig.graph.nodes)
        .find(([, nodeDef]) => nodeDef.trigger)
      
      if (!triggerNodeConfig) return null
      
      const [nodeId, nodeDefinition] = triggerNodeConfig
      
      // Get current node instance settings (these are always up-to-date)
      const nodeInstance = currentNodes.get(nodeId)
      const configSettings = nodeDefinition.settings || {}
      const instanceSettings = nodeInstance?.settings || {}
      // Prioritize instance settings since they reflect live parameter changes
      const settings = { ...configSettings, ...instanceSettings }
      
      console.log('🎨 Generating waveform for:', nodeDefinition.type, 'with settings:', settings)
      
      // Calculate buffer duration based on instrument type and envelope
      let bufferDuration = 1.0 // Default fallback
      
      if (nodeDefinition.type === 'MembraneSynth' && settings.envelope) {
        // Percussive instrument - use full ADSR cycle including sustainDuration
        // Use same fallback values as triggerGraph to ensure consistency
        bufferDuration = (settings.envelope.attack || 0.001) + 
                        (settings.envelope.decay || 0.4) + 
                        (settings.envelope.sustainDuration || 0.1) + 
                        (settings.envelope.release || 1.4) + 0.1
      } else if (nodeDefinition.type === 'Synth' && settings.envelope) {
        // Sustained instrument - add artificial sustain duration for visualization (1 second)
        const sustainDuration = 1.0 // Show 1 second of sustain for visualization
        bufferDuration = settings.envelope.attack + settings.envelope.decay + 
                        sustainDuration + settings.envelope.release + 0.1
      } else if (nodeDefinition.type === 'MetalSynth') {
        // MetalSynth has envelope: attack: 0.001, decay: 1.4, release: 0.2, sustain: 0
        const envelope = settings.envelope || {}
        const attackTime = envelope.attack || 0.001
        const decayTime = envelope.decay || 1.4 
        const releaseTime = envelope.release || 0.2
        bufferDuration = attackTime + decayTime + releaseTime + 0.1
      } else if (nodeDefinition.type === 'NoiseSynth' && settings.envelope) {
        // NoiseSynth uses envelope for timing
        bufferDuration = (settings.envelope.attack || 0.005) + 
                        (settings.envelope.decay || 0.3) + 
                        (settings.envelope.sustain || 0.0) + 
                        (settings.envelope.release || 0.3) + 0.1
      } else if (nodeDefinition.type === 'AMSynth' && settings.envelope) {
        // AMSynth - sustained instrument with single envelope
        const sustainDuration = 1.0 // Show 1 second of sustain for visualization
        bufferDuration = (settings.envelope.attack || 0.01) + 
                        (settings.envelope.decay || 0.3) + 
                        sustainDuration + 
                        (settings.envelope.release || 1.0) + 0.1
      } else if (nodeDefinition.type === 'FMSynth' && settings.envelope) {
        // FMSynth - sustained instrument with single envelope
        const sustainDuration = 1.0 // Show 1 second of sustain for visualization
        bufferDuration = (settings.envelope.attack || 0.01) + 
                        (settings.envelope.decay || 0.3) + 
                        sustainDuration + 
                        (settings.envelope.release || 1.0) + 0.1
      } else if (nodeDefinition.type === 'MonoSynth' && settings.envelope) {
        // MonoSynth - sustained instrument with single envelope
        const sustainDuration = 1.0 // Show 1 second of sustain for visualization
        bufferDuration = (settings.envelope.attack || 0.01) + 
                        (settings.envelope.decay || 0.3) + 
                        sustainDuration + 
                        (settings.envelope.release || 1.0) + 0.1
      } else if (nodeDefinition.type === 'DuoSynth') {
        // DuoSynth - sustained instrument with two voice envelopes
        const voice0Envelope = settings.voice0?.envelope || { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 }
        const voice1Envelope = settings.voice1?.envelope || { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 }
        
        // Calculate duration for each voice
        const sustainDuration = 1.0 // Show 1 second of sustain for visualization
        const voice0Duration = (voice0Envelope.attack || 0.01) + (voice0Envelope.decay || 0.3) + sustainDuration + (voice0Envelope.release || 1.0)
        const voice1Duration = (voice1Envelope.attack || 0.01) + (voice1Envelope.decay || 0.3) + sustainDuration + (voice1Envelope.release || 1.0)
        
        // Use the longer of the two voice durations
        bufferDuration = Math.max(voice0Duration, voice1Duration) + 0.1
      } else if (nodeDefinition.type === 'PolySynth') {
        // PolySynth - polyphonic instrument with voice-based envelope
        const voiceEnvelope = settings.voice?.envelope || { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 }
        const sustainDuration = 1.0 // Show 1 second of sustain for visualization
        bufferDuration = (voiceEnvelope.attack || 0.01) + 
                        (voiceEnvelope.decay || 0.3) + 
                        sustainDuration + 
                        (voiceEnvelope.release || 1.0) + 0.1
      }
      
      // Get Tone module for waveform generation
      const Tone = getToneModule()
      if (!Tone) {
        console.warn('⚠️ Cannot generate waveform - Tone.js not loaded')
        return null
      }

      // Generate waveform using Tone.Offline
      const buffer = await Tone.Offline((context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        let synth: any = null // eslint-disable-line @typescript-eslint/no-explicit-any
        let releaseTime = 2.0 // Default duration

        switch (nodeDefinition.type) {
          case 'Synth': {
            const synthSettings = {
              volume: settings.volume || -6,
              oscillator: {
                type: settings.oscillatorType || settings.oscillator?.type || 'sine'
              },
              envelope: {
                attack: settings.envelope?.attack || 0.01,
                decay: settings.envelope?.decay || 0.3,
                sustain: settings.envelope?.sustain || 0.3,
                release: settings.envelope?.release || 1.0
              }
            }
            synth = new Tone.Synth(synthSettings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack(settings.frequency || 440, 0)
            releaseTime = synthSettings.envelope.attack + synthSettings.envelope.decay + 1.0
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'MembraneSynth': {
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
                sustainDuration: settings.envelope?.sustainDuration || 0.1
              }
            }
            synth = new Tone.MembraneSynth(membraneSettings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack('C2', 0)
            releaseTime = membraneSettings.envelope.attack + membraneSettings.envelope.decay + 
                         membraneSettings.envelope.sustainDuration
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'AMSynth': {
            synth = new Tone.AMSynth(settings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack(settings.frequency || 440, 0)
            // Calculate proper release time from envelope settings
            const envelope = settings.envelope || {}
            releaseTime = (envelope.attack || 0.01) + (envelope.decay || 0.3) + 1.0 // 1 second sustain for visualization
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'FMSynth': {
            synth = new Tone.FMSynth(settings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack(settings.frequency || 440, 0)
            // Calculate proper release time from envelope settings
            const envelope = settings.envelope || {}
            releaseTime = (envelope.attack || 0.01) + (envelope.decay || 0.3) + 1.0 // 1 second sustain for visualization
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'DuoSynth': {
            synth = new Tone.DuoSynth(settings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack(settings.frequency || 440, 0)
            // Calculate proper release time from both voice envelope settings
            const voice0Envelope = settings.voice0?.envelope || { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 }
            const voice1Envelope = settings.voice1?.envelope || { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 }
            const voice0ReleaseTime = (voice0Envelope.attack || 0.01) + (voice0Envelope.decay || 0.3) + 1.0 // 1 second sustain
            const voice1ReleaseTime = (voice1Envelope.attack || 0.01) + (voice1Envelope.decay || 0.3) + 1.0 // 1 second sustain
            // Use the longer of the two voice durations
            releaseTime = Math.max(voice0ReleaseTime, voice1ReleaseTime)
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'MonoSynth': {
            // Transform flattened parameters to nested structure for Tone.js
            const monoSynthSettings = { ...settings }
            
            // Map filter parameters
            if ('Q' in settings || 'filterType' in settings || 'rolloff' in settings) {
              monoSynthSettings.filter = { ...(monoSynthSettings.filter || {}) }
              if ('Q' in settings) monoSynthSettings.filter.Q = settings.Q
              if ('filterType' in settings) monoSynthSettings.filter.type = settings.filterType
              if ('rolloff' in settings) monoSynthSettings.filter.rolloff = settings.rolloff
            }
            
            // Map filter envelope parameters
            if ('baseFrequency' in settings || 'octaves' in settings || 'exponent' in settings) {
              monoSynthSettings.filterEnvelope = { ...(monoSynthSettings.filterEnvelope || {}) }
              if ('baseFrequency' in settings) monoSynthSettings.filterEnvelope.baseFrequency = settings.baseFrequency
              if ('octaves' in settings) monoSynthSettings.filterEnvelope.octaves = settings.octaves
              if ('exponent' in settings) monoSynthSettings.filterEnvelope.exponent = settings.exponent
            }
            
            synth = new Tone.MonoSynth(monoSynthSettings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack(settings.frequency || 440, 0)
            // Calculate proper release time from envelope settings
            const envelope = settings.envelope || {}
            releaseTime = (envelope.attack || 0.01) + (envelope.decay || 0.3) + 1.0 // 1 second sustain for visualization
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'PluckSynth': {
            synth = new Tone.PluckSynth(settings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack(settings.frequency || 440, 0)
            releaseTime = 2.0
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'PolySynth': {
            // Create PolySynth with voice settings applied
            const voiceEnvelope = settings.voice?.envelope || { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1.0 }
            const voiceOscillator = settings.voice?.oscillator || { type: 'sawtooth' }
            
            console.log('🎨 PolySynth waveform generation - voice oscillator:', voiceOscillator)
            console.log('🎨 PolySynth waveform generation - voice envelope:', voiceEnvelope)
            
            // PolySynth constructor: new PolySynth(VoiceClass, voiceOptions)
            const voiceOptions = {
              oscillator: voiceOscillator,
              envelope: voiceEnvelope,
              volume: settings.volume || -6
            }
            
            console.log('🎨 PolySynth waveform generation - voice options:', voiceOptions)
            synth = new Tone.PolySynth(Tone.Synth, voiceOptions)
            
            // Apply maxPolyphony separately if supported
            if ('maxPolyphony' in synth) {
              synth.maxPolyphony = settings.maxPolyphony || 8
            }
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            const frequency = settings.frequency || 440
            synth.triggerAttack(frequency, 0)
            // Calculate proper release time from voice envelope settings
            releaseTime = (voiceEnvelope.attack || 0.01) + (voiceEnvelope.decay || 0.3) + 1.0 // 1 second sustain for visualization
            // PolySynth.triggerRelease(note, time) - note first, then time
            synth.triggerRelease(frequency, releaseTime)
            break
          }
          
          case 'MetalSynth': {
            synth = new Tone.MetalSynth(settings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            const frequency = settings.frequency || 440
            synth.triggerAttack(frequency, 0) // MetalSynth needs a frequency parameter
            releaseTime = (settings.envelope?.attack || 0.001) + (settings.envelope?.decay || 1.4)
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'NoiseSynth': {
            const noiseSettings = {
              volume: settings.volume || -6,
              noise: { type: settings.noise?.type || 'white' },
              envelope: {
                attack: settings.envelope?.attack || 0.005,
                decay: settings.envelope?.decay || 0.3,
                sustain: settings.envelope?.sustain || 0.0,
                release: settings.envelope?.release || 0.3
              }
            }
            synth = new Tone.NoiseSynth(noiseSettings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack(0) // NoiseSynth doesn't take a note parameter
            releaseTime = noiseSettings.envelope.attack + noiseSettings.envelope.decay + 0.1
            synth.triggerRelease(releaseTime)
            break
          }
          
          case 'Sampler': {
            // Sampler needs URLs, use a simple fallback
            const samplerSettings = {
              ...settings,
              urls: settings.urls || { 'C4': 'https://tonejs.github.io/audio/berklee/ahh_c4.mp3' }
            }
            synth = new Tone.Sampler(samplerSettings)
            synth.connect((context as any).destination) // eslint-disable-line @typescript-eslint/no-explicit-any
            synth.triggerAttack('C4', 0)
            releaseTime = 2.0
            synth.triggerRelease('C4', releaseTime)
            break
          }
          
          default:
            console.warn('⚠️ Unsupported instrument type for waveform generation:', nodeDefinition.type)
            return
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
  }, [])

  // Initialize graph when config changes
  const initializeGraph = useCallback(async (configToUse?: AudioGraphConfig) => {
    const activeConfig = configToUse || config
    if (!activeConfig) return
    
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
      setIsGraphInitialized(true)
      console.log('✅ Audio graph initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize audio graph:', error)
    }
  }, [config, createNode, addModulationRoute])

  // Handle config changes with proper cleanup
  useEffect(() => {
    if (initialConfig && initialConfig !== config && !initializingRef.current) {
      initializingRef.current = true
      
      console.log('🔄 Config changed, updating graph:', initialConfig.name)
      
      // Release any currently playing audio before cleanup
      if (isPlaying && config) {
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
      updateConfig(() => initialConfig)
      graphStateRef.current.isInitialized = false
      setIsGraphInitialized(false)
      setWaveformData(null)
      
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

  // Ensure initialization runs on mount (only if config provided)
  useEffect(() => {
    if (initialConfig && !graphStateRef.current.isInitialized && !initializingRef.current) {
      console.log('🚀 Initial graph setup on mount')
      initializingRef.current = true
      
      setTimeout(() => {
        initializeGraph().finally(() => {
          initializingRef.current = false
        })
      }, 50)
    }
  }, [initialConfig, initializeGraph])

  // Generate initial waveform data when graph is ready
  useEffect(() => {
    if (isGraphInitialized && nodes.size > 0 && !waveformData) {
      console.log('🎨 Generating initial waveform data after initialization...')
      const generateInitialWaveform = async () => {
        try {
          const newWaveformData = await generateWaveformData()
          if (newWaveformData) {
            setWaveformData(newWaveformData)
            console.log('✅ Initial waveform data generated')
          } else {
            console.log('⚠️ No initial waveform data generated')
          }
        } catch (error) {
          console.error('❌ Error generating initial waveform data:', error)
        }
      }
      
      // Small delay to ensure nodes are fully ready
      const timer = setTimeout(generateInitialWaveform, 150)
      return () => clearTimeout(timer)
    }
  }, [isGraphInitialized, nodes, waveformData, generateWaveformData])

  // Generate waveform data when config structure changes (like switching instruments)
  const configVersionRef = useRef<string>('')
  useEffect(() => {
    if (!config) return
    
    // Only regenerate if config structure actually changed (node types, not just settings)
    const configStructure = JSON.stringify(
      Object.fromEntries(
        Object.entries(config.graph.nodes).map(([id, node]) => [id, { type: node.type, trigger: node.trigger }])
      )
    )
    
    if (graphStateRef.current.isInitialized && 
        configStructure !== configVersionRef.current) {
      
      console.log('🎨 Config structure changed, regenerating waveform...')
      configVersionRef.current = configStructure
      
      const generateWaveform = async () => {
        const newWaveformData = await generateWaveformData()
        setWaveformData(newWaveformData)
      }
      
      // Small delay to ensure any settings updates are complete
      const timer = setTimeout(generateWaveform, 100)
      return () => clearTimeout(timer)
    } else if (configVersionRef.current === '') {
      // Store initial structure
      configVersionRef.current = configStructure
    }
  }, [config, generateWaveformData])

  // Update graph configuration
  const updateGraphConfig = useCallback((newConfig: Partial<AudioGraphConfig>) => {
    updateConfig(draft => {
      if (draft) {
        Object.assign(draft, newConfig)
      }
    })
  }, [updateConfig])

  // Update node settings within the graph
  const updateNodeInGraph = useCallback(async (nodeId: string, settings: Record<string, unknown>) => {
    await updateNodeSettings(nodeId, settings)
    
    // Apply any modulation that might affect this node
    applyModulation(nodeId)
    
    // Update config to keep it in sync with live state
    updateConfig(draft => {
      if (draft?.graph.nodes[nodeId]) {
        // Ensure settings object exists
        if (!draft.graph.nodes[nodeId].settings) {
          draft.graph.nodes[nodeId].settings = {}
        }
        
        Object.assign(draft.graph.nodes[nodeId].settings, settings)
      }
    })
    
    // Regenerate waveform when node settings change
    // This is needed because parameter changes don't change the config structure
    // Regenerate waveform with current live data (no setTimeout needed)
    try {
      const newWaveformData = await generateWaveformData()
      setWaveformData(newWaveformData)
    } catch (error) {
      console.error('❌ Error regenerating waveform after settings update:', error)
    }
  }, [updateNodeSettings, applyModulation, updateConfig, generateWaveformData])

  // Trigger the graph (start playback)
  const triggerGraph = useCallback(async (note?: string | number) => {
    if (!config) return
    
    console.log('🎵 triggerGraph called, initialized:', graphStateRef.current.isInitialized)
    
    // Tone.js should already be loaded and initialized
    const Tone = getToneModule()
    
    if (!Tone) {
      console.error('❌ Tone.js not loaded! This should not happen.')
      return
    }
    
    // AudioContext should already be running from initialization
    console.log('✅ AudioContext state:', Tone.getContext().state)
    
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
          // For bass kick style - use triggerAttack and delayed triggerRelease
          // This lets the instrument's envelope handle the amplitude curve naturally
          
          // Calculate timing based on instrument type
          let releaseStartTime: number
          let totalDuration: number
          
          if (node.type === 'MetalSynth') {
            // MetalSynth has envelope: attack: 0.001, decay: 1.4, release: 0.2, sustain: 0
            const envelope = node.settings.envelope || {}
            const attackTime = envelope.attack || 0.001
            const decayTime = envelope.decay || 1.4
            const releaseTime = envelope.release || 0.2
            
            // MetalSynth has sustain=0, so it's attack+decay, then release
            releaseStartTime = attackTime + decayTime
            totalDuration = releaseStartTime + releaseTime
          } else if (node.type === 'NoiseSynth') {
            // Use NoiseSynth envelope settings
            const envelope = node.settings.envelope || {}
            const attackTime = envelope.attack || 0.005
            const decayTime = envelope.decay || 0.3
            const releaseTime = envelope.release || 0.3
            
            releaseStartTime = attackTime + decayTime + 0.1 // Short sustain for noise
            totalDuration = releaseStartTime + releaseTime
          } else {
            // Standard envelope-based instruments (MembraneSynth, etc.)
            const envelope = node.settings.envelope || {}
            const attackTime = envelope.attack || 0.001
            const decayTime = envelope.decay || 0.4
            const sustainDuration = envelope.sustainDuration || 0.1
            const releaseTime = envelope.release || 1.4
            
            releaseStartTime = attackTime + decayTime + sustainDuration
            totalDuration = releaseStartTime + releaseTime
          }
          
          // Handle different instrument types for triggering
          if (node.type === 'NoiseSynth') {
            // NoiseSynth doesn't need a note parameter
            console.log(`🔊 Triggering ${node.type} attack (no note)`)
            toneNode.triggerAttack()
          } else if (node.type === 'MetalSynth') {
            // MetalSynth needs a frequency/note parameter
            const noteToPlay = note || node.settings.frequency || 440
            console.log(`🔊 Triggering MetalSynth attack with note:`, noteToPlay)
            toneNode.triggerAttack(noteToPlay)
          } else {
            // Other instruments need a note
            const noteToPlay = note || 'C2'
            console.log('🥁 Triggering attack:', noteToPlay)
            toneNode.triggerAttack(noteToPlay)
          }
          
          console.log('🥁 Release timing - start at:', releaseStartTime + 's', 'total duration:', totalDuration + 's')
          
          // Schedule the release after the sustain duration
          setTimeout(() => {
            if (toneNode && 'triggerRelease' in toneNode) {
              console.log('🥁 Triggering bass kick release')
              toneNode.triggerRelease()
            }
          }, releaseStartTime * 1000)
          
          setIsPlaying(true)
          setTimeout(() => setIsPlaying(false), Math.max(150, totalDuration * 1000))
        } else {
          // For synth style - sustained note
          // Release any currently playing note first to prevent overlapping
          if ('triggerRelease' in toneNode && isPlaying) {
            console.log('🎹 Releasing current note before new attack')
            
            // Special handling for PolySynth
            if (node.type === 'PolySynth') {
              if ('releaseAll' in toneNode) {
                console.log('🔇 PolySynth: Releasing all voices before new attack')
                toneNode.releaseAll()
              }
            } else {
              toneNode.triggerRelease()
            }
          }
          
          // Handle different instrument types for sustained triggering
          if (node.type === 'NoiseSynth') {
            // NoiseSynth doesn't need a note parameter
            console.log(`🔊 Triggering sustained ${node.type} attack (no note)`)
            toneNode.triggerAttack()
          } else {
            // MetalSynth and other instruments need a note parameter
            const currentFrequency = node.settings.frequency || 440
            const noteToPlay = note || currentFrequency
            console.log(`🎹 Triggering sustained ${node.type} note (triggerAttack):`, noteToPlay)
            toneNode.triggerAttack(noteToPlay)
          }
          setIsPlaying(true)
        }
      } else {
        console.warn('⚠️ Node not triggerable:', nodeId)
      }
    }
  }, [config, getNodeById, waveformData, generateWaveformData, initializeNodeInstance, isPlaying])

  // Release the graph (stop playback for sustained notes)
  const releaseGraph = useCallback(() => {
    console.log('🛑 releaseGraph called')
    
    // Always attempt to stop any playing audio, regardless of initialization state
    // This fixes the race condition where config changes clear isInitialized but we still need to stop audio
    if (!isPlaying) {
      console.log('⏭️ Skipping release - not playing')
      return
    }
    
    if (!config) return
    
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
        
        // Special handling for PolySynth which requires note parameter
        if (node.type === 'PolySynth') {
          // PolySynth needs to release all active voices - use releaseAll()
          if ('releaseAll' in toneNode) {
            console.log('🔇 PolySynth: Releasing all voices')
            toneNode.releaseAll()
          } else {
            // Fallback: try to release the frequency that was triggered
            const frequency = node.settings.frequency || 440
            console.log('🔇 PolySynth: Releasing specific note:', frequency)
            toneNode.triggerRelease(frequency)
          }
        } else {
          // Standard triggerRelease for monophonic synths
          toneNode.triggerRelease()
        }
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
    config: initialConfig ? config : null,
    isPlaying: initialConfig ? isPlaying : false,
    nodes: initialConfig ? nodes : new Map(),
    connections: initialConfig ? connections : [],
    modulationRoutes: initialConfig ? modulationRoutes : [],
    updateConfig: initialConfig ? updateGraphConfig : () => {},
    updateNodeInGraph: initialConfig ? updateNodeInGraph : async () => {},
    initializeGraph: initialConfig ? initializeGraph : async () => {},
    triggerGraph: initialConfig ? triggerGraph : async () => {},
    releaseGraph: initialConfig ? releaseGraph : () => {},
    getWaveformData: initialConfig ? getWaveformData : () => null,
    cleanup: initialConfig ? cleanup : () => {}
  }
}