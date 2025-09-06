import { useState, useCallback, useRef } from 'react'
import * as Tone from 'tone'
import { useAudioNodes } from './useAudioNodes'
import { useGraphConnections } from './useGraphConnections'
import { useModulationMatrix } from './useModulationMatrix'
import type { AudioGraphConfig, AudioGraphState } from '../types/audioGraph'

export function useAudioGraph(initialConfig: AudioGraphConfig) {
  const [config, setConfig] = useState<AudioGraphConfig>(initialConfig)
  const [isPlaying, setIsPlaying] = useState(false)
  const graphStateRef = useRef<AudioGraphState>({
    nodes: new Map(),
    connections: [],
    isInitialized: false
  })

  // Use the specialized hooks for managing different aspects
  const { 
    nodes, 
    createNode, 
    updateNodeSettings, 
    disposeNode,
    getNodeById 
  } = useAudioNodes()

  const { 
    connections, 
    connect, 
    validateConnection 
  } = useGraphConnections(nodes)

  const { 
    modulationRoutes, 
    addModulationRoute, 
    applyModulation 
  } = useModulationMatrix(nodes)

  // Initialize graph from config
  const initializeGraph = useCallback(async () => {
    console.log('🔧 Initializing audio graph:', config.name)
    
    try {
      // Create all nodes first
      for (const [nodeId, nodeDefinition] of Object.entries(config.graph.nodes)) {
        await createNode(nodeId, nodeDefinition)
      }

      // Then establish connections
      for (const connection of config.graph.connections) {
        const isValid = validateConnection(connection.from, connection.to)
        if (isValid) {
          connect(connection.from, connection.to)
        } else {
          console.warn('⚠️ Invalid connection:', connection)
        }
      }

      // Apply modulation routes if any
      if (config.graph.modulation) {
        for (const route of config.graph.modulation) {
          addModulationRoute(route)
        }
      }

      graphStateRef.current.isInitialized = true
      console.log('✅ Audio graph initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize audio graph:', error)
    }
  }, [config, createNode, connect, validateConnection, addModulationRoute])

  // Update graph configuration
  const updateConfig = useCallback((newConfig: Partial<AudioGraphConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Update node settings within the graph
  const updateNodeInGraph = useCallback((nodeId: string, settings: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    updateNodeSettings(nodeId, settings)
    
    // Apply any modulation that might affect this node
    applyModulation(nodeId)
  }, [updateNodeSettings, applyModulation])

  // Trigger the graph (start playback)
  const triggerGraph = useCallback(async (note?: string | number) => {
    if (!graphStateRef.current.isInitialized) {
      await initializeGraph()
    }

    if (Tone.getContext().state !== 'running') {
      await Tone.start()
    }

    // Find trigger nodes (nodes marked as triggers in the config)
    const triggerNodes = Object.entries(config.graph.nodes)
      .filter(([, nodeDef]) => nodeDef.trigger)
      .map(([nodeId]) => nodeId)

    // Trigger all trigger nodes
    for (const nodeId of triggerNodes) {
      const node = getNodeById(nodeId)
      if (node && 'triggerAttackRelease' in node.instance) {
        const toneNode = node.instance as Tone.Synth | Tone.MembraneSynth
        if (config.graph.trigger === 'momentary') {
          // For bass kick style - one shot trigger
          toneNode.triggerAttackRelease(note || 'C2', '8n')
          setIsPlaying(true)
          setTimeout(() => setIsPlaying(false), 150)
        } else {
          // For synth style - sustained note
          toneNode.triggerAttack(note || 440)
          setIsPlaying(true)
        }
      }
    }
  }, [config, initializeGraph, getNodeById])

  // Release the graph (stop playback for sustained notes)
  const releaseGraph = useCallback(() => {
    const triggerNodes = Object.entries(config.graph.nodes)
      .filter(([, nodeDef]) => nodeDef.trigger)
      .map(([nodeId]) => nodeId)

    for (const nodeId of triggerNodes) {
      const node = getNodeById(nodeId)
      if (node && 'triggerRelease' in node.instance) {
        const toneNode = node.instance as Tone.Synth | Tone.MembraneSynth
        toneNode.triggerRelease()
      }
    }
    setIsPlaying(false)
  }, [config, getNodeById])

  // Get waveform data for visualization
  const getWaveformData = useCallback((): Float32Array | null => {
    // Find the output node or recorder node for waveform data
    const outputNode = getNodeById('output')
    if (outputNode && outputNode.waveformData) {
      return outputNode.waveformData
    }
    return null
  }, [getNodeById])

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