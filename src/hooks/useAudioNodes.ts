import { useState, useCallback, useRef } from 'react'
import * as Tone from 'tone'
import type { AudioNodeType, AudioNodeDefinition, NodeInstance } from '../types/audioGraph'

// Factory function to create Tone.js instances based on node type
const createToneInstance = (type: AudioNodeType, settings: Record<string, any> = {}): any => {
  console.log('🏭 Creating Tone.js instance:', type, settings)
  
  try {
    switch (type) {
      // Synthesizers
      case 'Synth':
        return new Tone.Synth(settings)
      case 'MembraneSynth':
        return new Tone.MembraneSynth(settings)
      case 'AMSynth':
        return new Tone.AMSynth(settings)
      case 'FMSynth':
        return new Tone.FMSynth(settings)
      case 'DuoSynth':
        return new Tone.DuoSynth(settings)
      case 'MonoSynth':
        return new Tone.MonoSynth(settings)
      case 'PluckSynth':
        return new Tone.PluckSynth(settings)
      case 'PolySynth':
        return new Tone.PolySynth(settings)
      
      // Oscillators and LFOs
      case 'Oscillator':
        return new Tone.Oscillator(settings)
      case 'LFO':
        return new Tone.LFO(settings)
      
      // Filters and Effects
      case 'Filter':
        return new Tone.Filter(settings)
      case 'Gain':
        return new Tone.Gain(settings)
      case 'Delay':
        return new Tone.Delay(settings)
      case 'Reverb':
        return new Tone.Reverb(settings)
      case 'Distortion':
        return new Tone.Distortion(settings)
      case 'Chorus':
        return new Tone.Chorus(settings)
      case 'PingPongDelay':
        return new Tone.PingPongDelay(settings)
      case 'AutoFilter':
        return new Tone.AutoFilter(settings)
      case 'AutoPanner':
        return new Tone.AutoPanner(settings)
      case 'AutoWah':
        return new Tone.AutoWah(settings)
      case 'BitCrusher':
        return new Tone.BitCrusher(settings)
      case 'Chebyshev':
        return new Tone.Chebyshev(settings)
      case 'FeedbackDelay':
        return new Tone.FeedbackDelay(settings)
      case 'Freeverb':
        return new Tone.Freeverb(settings)
      case 'JCReverb':
        return new Tone.JCReverb(settings)
      case 'Phaser':
        return new Tone.Phaser(settings)
      case 'Tremolo':
        return new Tone.Tremolo(settings)
      case 'Vibrato':
        return new Tone.Vibrato(settings)
      
      // Utilities
      case 'Multiply':
        return new Tone.Multiply(settings.factor || 1)
      case 'Add':
        return new Tone.Add(settings.addend || 0)
      case 'ADSR':
        // ADSR is typically part of instruments, but we can create a standalone envelope
        return new Tone.AmplitudeEnvelope(settings)
      case 'Recorder':
        return new Tone.Recorder()
      case 'Output':
        // Output represents the destination - return a gain node as a proxy
        return new Tone.Gain(1).toDestination()
      
      default:
        console.warn('⚠️ Unknown node type:', type, '- falling back to Gain')
        return new Tone.Gain(1)
    }
  } catch (error) {
    console.error('❌ Failed to create', type, ':', error)
    console.log('🔄 Falling back to Gain node')
    return new Tone.Gain(1)
  }
}

export function useAudioNodes() {
  const [, setNodes] = useState<Map<string, NodeInstance>>(new Map())
  const nodesRef = useRef<Map<string, NodeInstance>>(new Map())

  // Keep ref in sync with state
  const updateNodesRef = useCallback((newNodes: Map<string, NodeInstance>) => {
    nodesRef.current = newNodes
    setNodes(new Map(newNodes)) // Create new Map to trigger re-renders
  }, [])

  // Create a new audio node
  const createNode = useCallback(async (nodeId: string, definition: AudioNodeDefinition): Promise<NodeInstance | null> => {
    console.log('🔧 Creating node:', nodeId, definition)
    
    try {
      // Create the Tone.js instance
      const instance = createToneInstance(definition.type, definition.settings)
      
      // Create the node instance wrapper
      const nodeInstance: NodeInstance = {
        id: nodeId,
        type: definition.type,
        instance,
        settings: definition.settings || {},
        inputs: new Map(),
        outputs: new Map(),
        isDisposed: false
      }
      
      // Add to the nodes map
      const newNodes = new Map(nodesRef.current)
      newNodes.set(nodeId, nodeInstance)
      updateNodesRef(newNodes)
      
      console.log('✅ Node created successfully:', nodeId)
      return nodeInstance
      
    } catch (error) {
      console.error('❌ Failed to create node:', nodeId, error)
      return null
    }
  }, [updateNodesRef])

  // Update node settings
  const updateNodeSettings = useCallback((nodeId: string, newSettings: Record<string, any>) => {
    const node = nodesRef.current.get(nodeId)
    if (!node || node.isDisposed) {
      console.warn('⚠️ Cannot update settings for non-existent or disposed node:', nodeId)
      return
    }

    try {
      // Update our internal settings
      const updatedSettings = { ...node.settings, ...newSettings }
      
      // Apply settings to the Tone.js instance
      const instance = node.instance
      for (const [key, value] of Object.entries(newSettings)) {
        if (instance[key] !== undefined) {
          if (typeof instance[key] === 'object' && 'value' in instance[key]) {
            // Handle Tone.js Param objects (like volume, frequency, etc.)
            instance[key].value = value
          } else {
            // Handle direct properties
            instance[key] = value
          }
        }
      }
      
      // Update the node instance
      const updatedNode: NodeInstance = {
        ...node,
        settings: updatedSettings
      }
      
      const newNodes = new Map(nodesRef.current)
      newNodes.set(nodeId, updatedNode)
      updateNodesRef(newNodes)
      
      console.log('✅ Node settings updated:', nodeId, newSettings)
      
    } catch (error) {
      console.error('❌ Failed to update node settings:', nodeId, error)
    }
  }, [updateNodesRef])

  // Get node by ID
  const getNodeById = useCallback((nodeId: string): NodeInstance | undefined => {
    return nodesRef.current.get(nodeId)
  }, [])

  // Dispose a node and clean up its resources
  const disposeNode = useCallback((nodeId: string) => {
    const node = nodesRef.current.get(nodeId)
    if (!node) {
      console.warn('⚠️ Cannot dispose non-existent node:', nodeId)
      return
    }

    try {
      // Dispose the Tone.js instance if it has a dispose method
      if (node.instance && typeof node.instance.dispose === 'function') {
        node.instance.dispose()
      }
      
      // Mark as disposed and remove from map
      node.isDisposed = true
      const newNodes = new Map(nodesRef.current)
      newNodes.delete(nodeId)
      updateNodesRef(newNodes)
      
      console.log('✅ Node disposed:', nodeId)
      
    } catch (error) {
      console.error('❌ Failed to dispose node:', nodeId, error)
    }
  }, [updateNodesRef])

  // Get all nodes as an array
  const getAllNodes = useCallback((): NodeInstance[] => {
    return Array.from(nodesRef.current.values()).filter(node => !node.isDisposed)
  }, [])

  // Clear all nodes
  const clearAllNodes = useCallback(() => {
    console.log('🧹 Clearing all audio nodes')
    
    // Dispose all nodes
    for (const node of nodesRef.current.values()) {
      if (node.instance && typeof node.instance.dispose === 'function') {
        try {
          node.instance.dispose()
        } catch (error) {
          console.error('❌ Error disposing node during clear:', node.id, error)
        }
      }
    }
    
    updateNodesRef(new Map())
  }, [updateNodesRef])

  return {
    nodes: nodesRef.current,
    createNode,
    updateNodeSettings,
    getNodeById,
    disposeNode,
    getAllNodes,
    clearAllNodes
  }
}