import { useState, useCallback, useRef } from 'react'
import { getToneModule } from '../utils/toneLoader'
import type { AudioNodeType, AudioNodeDefinition, NodeInstance } from '../types/audioGraph'

// Factory function to create Tone.js instances based on node type
const createToneInstance = (type: AudioNodeType, settings: Record<string, any> = {}): any => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const Tone = getToneModule()
  if (!Tone) {
    throw new Error('Tone.js not loaded yet')
  }

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
      case 'DuoSynth': {
        const duoSynth = new Tone.DuoSynth(settings)
        console.log('🔍 DuoSynth structure:', {
          voice0: duoSynth.voice0,
          voice0_oscillator: duoSynth.voice0?.oscillator,
          voice0_envelope: duoSynth.voice0?.envelope,
          voice1: duoSynth.voice1,
          voice1_oscillator: duoSynth.voice1?.oscillator, 
          voice1_envelope: duoSynth.voice1?.envelope
        })
        return duoSynth
      }
      case 'MonoSynth': {
        const monoSynth = new Tone.MonoSynth(settings)
        console.log('🔍 MonoSynth structure:', {
          filter: monoSynth.filter,
          filterQ: monoSynth.filter?.Q,
          filterType: monoSynth.filter?.type,
          filterRolloff: monoSynth.filter?.rolloff,
          filterEnvelope: monoSynth.filterEnvelope,
          filterEnv_baseFreq: monoSynth.filterEnvelope?.baseFrequency,
          filterEnv_octaves: monoSynth.filterEnvelope?.octaves,
          filterEnv_exponent: monoSynth.filterEnvelope?.exponent
        })
        return monoSynth
      }
      case 'PluckSynth':
        return new Tone.PluckSynth(settings)
      case 'PolySynth':
        return new Tone.PolySynth(settings)
      case 'MetalSynth':
        return new Tone.MetalSynth(settings)
      case 'NoiseSynth':
        return new Tone.NoiseSynth(settings)
      case 'Sampler':
        return new Tone.Sampler(settings)
      
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

// Transform settings for specific node types to match Tone.js expectations
const transformSettingsForNodeType = (nodeType: AudioNodeType, settings: Record<string, any>): Record<string, any> => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const transformed = { ...settings }

  // Handle MembraneSynth specific transformations
  if (nodeType === 'MembraneSynth') {
    // Convert oscillatorType to oscillator.type structure
    if ('oscillatorType' in settings) {
      console.log('🔧 Transforming oscillatorType for MembraneSynth:', settings.oscillatorType)
      transformed.oscillator = { 
        ...transformed.oscillator, 
        type: settings.oscillatorType 
      }
      // Remove the original flat property since we've nested it
      delete transformed.oscillatorType
    }
  }

  // Handle regular Synth transformations
  if (nodeType === 'Synth') {
    // Convert oscillatorType to oscillator.type structure
    if ('oscillatorType' in settings) {
      transformed.oscillator = { 
        ...transformed.oscillator, 
        type: settings.oscillatorType 
      }
      // Remove the original flat property since we've nested it
      delete transformed.oscillatorType
    }
  }

  // Handle MonoSynth specific transformations
  if (nodeType === 'MonoSynth') {
    // MonoSynth has filter and filterEnvelope parameters that need special mapping
    console.log('🔧 Processing MonoSynth settings:', settings)
    
    // Map flattened filter parameters to nested structure
    if ('Q' in settings || 'filterType' in settings || 'rolloff' in settings) {
      // Preserve existing filter settings and add new ones
      transformed.filter = { ...(transformed.filter || {}) }
      if ('Q' in settings) {
        console.log('🔧 Mapping Q parameter:', settings.Q)
        transformed.filter.Q = settings.Q
      }
      if ('filterType' in settings) {
        console.log('🔧 Mapping filterType parameter:', settings.filterType)
        transformed.filter.type = settings.filterType
      }
      if ('rolloff' in settings) {
        console.log('🔧 Mapping rolloff parameter:', settings.rolloff)
        transformed.filter.rolloff = settings.rolloff
      }
    }
    
    // Map flattened filter envelope parameters to nested structure
    if ('baseFrequency' in settings || 'octaves' in settings || 'exponent' in settings) {
      // Preserve existing filterEnvelope settings and add new ones
      transformed.filterEnvelope = { ...(transformed.filterEnvelope || {}) }
      if ('baseFrequency' in settings) {
        console.log('🔧 Mapping baseFrequency parameter:', settings.baseFrequency)
        transformed.filterEnvelope.baseFrequency = settings.baseFrequency
      }
      if ('octaves' in settings) {
        console.log('🔧 Mapping octaves parameter:', settings.octaves)
        transformed.filterEnvelope.octaves = settings.octaves
      }
      if ('exponent' in settings) {
        console.log('🔧 Mapping exponent parameter:', settings.exponent)
        transformed.filterEnvelope.exponent = settings.exponent
      }
    }
  }

  // Handle DuoSynth specific transformations
  if (nodeType === 'DuoSynth') {
    // DuoSynth has voice0 and voice1 with nested oscillator and envelope settings
    console.log('🔧 Processing DuoSynth settings:', settings)
    
    // Handle voice0 settings
    if ('voice0' in settings && typeof settings.voice0 === 'object' && settings.voice0 !== null) {
      const voice0 = settings.voice0 as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
      if ('oscillatorType' in voice0) {
        transformed.voice0 = {
          ...voice0,
          oscillator: {
            ...(voice0.oscillator || {}),
            type: voice0.oscillatorType
          }
        }
        delete (transformed.voice0 as any).oscillatorType // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }
    
    // Handle voice1 settings
    if ('voice1' in settings && typeof settings.voice1 === 'object' && settings.voice1 !== null) {
      const voice1 = settings.voice1 as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
      if ('oscillatorType' in voice1) {
        transformed.voice1 = {
          ...voice1,
          oscillator: {
            ...(voice1.oscillator || {}),
            type: voice1.oscillatorType
          }
        }
        delete (transformed.voice1 as any).oscillatorType // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }
  }

  return transformed
}

export function useAudioNodes() {
  const [nodes, setNodes] = useState<Map<string, NodeInstance>>(new Map())
  const nodesRef = useRef<Map<string, NodeInstance>>(new Map())

  // Keep ref in sync with state
  const updateNodesRef = useCallback((newNodes: Map<string, NodeInstance>) => {
    nodesRef.current = newNodes
    setNodes(new Map(newNodes)) // Create new Map to trigger re-renders
  }, [])

  // Create a new audio node (lazy initialization - Tone.js instance created on first use)
  const createNode = useCallback(async (nodeId: string, definition: AudioNodeDefinition): Promise<NodeInstance | null> => {
    console.log('🔧 Creating node placeholder:', nodeId, definition)
    
    try {
      // Create the node instance wrapper WITHOUT creating the Tone.js instance yet
      // This avoids AudioContext initialization during page load
      const nodeInstance: NodeInstance = {
        id: nodeId,
        type: definition.type,
        instance: null, // Will be lazily created on first access
        settings: definition.settings || {},
        inputs: new Map(),
        outputs: new Map(),
        isDisposed: false
      }
      
      // Add to the nodes map
      const newNodes = new Map(nodesRef.current)
      newNodes.set(nodeId, nodeInstance)
      updateNodesRef(newNodes)
      
      console.log('✅ Node placeholder created successfully:', nodeId)
      return nodeInstance
      
    } catch (error) {
      console.error('❌ Failed to create node:', nodeId, error)
      return null
    }
  }, [updateNodesRef])

  // Lazy initialize a node's Tone.js instance
  const initializeNodeInstance = useCallback(async (nodeInstance: NodeInstance): Promise<boolean> => {
    if (nodeInstance.instance !== null || nodeInstance.isDisposed) {
      return true // Already initialized or disposed
    }

    try {
      console.log('🏭 Lazy initializing Tone.js instance for:', nodeInstance.id)
      
      // Tone.js should already be loaded
      const Tone = getToneModule()
      if (!Tone) {
        throw new Error('Tone.js not loaded - initialization should have been completed')
      }
      
      nodeInstance.instance = createToneInstance(nodeInstance.type, nodeInstance.settings)
      
      // If this is a trigger node, connect it to destination
      if (nodeInstance.instance && typeof nodeInstance.instance.toDestination === 'function') {
        nodeInstance.instance.toDestination()
        console.log('✅ Connected lazy node to destination:', nodeInstance.id)
      }
      
      return true
    } catch (error) {
      console.error('❌ Failed to lazy initialize node:', nodeInstance.id, error)
      return false
    }
  }, [])

  // Update node settings
  const updateNodeSettings = useCallback(async (nodeId: string, newSettings: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const node = nodesRef.current.get(nodeId)
    if (!node || node.isDisposed) {
      console.warn('⚠️ Cannot update settings for non-existent or disposed node:', nodeId, 'Available nodes:', Array.from(nodesRef.current.keys()))
      return
    }

    try {
      console.log(`🔧 Updating settings for ${nodeId} (${node.type}):`, newSettings)
      
      // Update our internal settings
      const updatedSettings = { ...node.settings, ...newSettings }
      
      // Transform settings for specific node types if needed
      const transformedSettings = transformSettingsForNodeType(node.type, newSettings)
      console.log(`🔧 Transformed settings:`, transformedSettings)
      
      // Apply settings to the Tone.js instance (initialize if needed)
      let instance = node.instance
      if (instance === null) {
        console.log('🔧 Auto-initializing node for settings update:', nodeId)
        const initialized = await initializeNodeInstance(node)
        if (!initialized) {
          console.error('❌ Failed to initialize node for settings update:', nodeId)
          return
        }
        instance = node.instance
      }
      
      for (const [key, value] of Object.entries(transformedSettings)) {
        console.log(`🔍 Processing property: ${key} =`, value)
        if (instance[key] !== undefined) {
          if (typeof instance[key] === 'object' && 'value' in instance[key] && typeof value === 'number') {
            // Handle Tone.js Param objects (like volume, frequency, etc.) - setting numeric values
            console.log(`🔧 Setting Tone.js Param ${key}.value =`, value)
            instance[key].value = value
          } else if (typeof value === 'object' && value !== null) {
            // Handle nested objects like oscillator, envelope, voice0, voice1
            if (typeof instance[key] === 'object' && instance[key] !== null) {
              const applyNestedSettings = (target: any, settings: any, path: string = key) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                for (const [nestedKey, nestedValue] of Object.entries(settings)) {
                  const nestedPath = `${path}.${nestedKey}`
                  
                  if (target[nestedKey] !== undefined) {
                    console.log(`🔍 Analyzing ${nestedPath}:`, {
                      nestedKey,
                      nestedValue,
                      targetType: typeof target[nestedKey],
                      hasValue: target[nestedKey] && typeof target[nestedKey] === 'object' && 'value' in target[nestedKey],
                      isEnvelope: nestedKey === 'envelope',
                      hasADSR: typeof nestedValue === 'object' && nestedValue !== null && (Object.prototype.hasOwnProperty.call(nestedValue, 'attack') || Object.prototype.hasOwnProperty.call(nestedValue, 'decay') || Object.prototype.hasOwnProperty.call(nestedValue, 'sustain') || Object.prototype.hasOwnProperty.call(nestedValue, 'release'))
                    })

                    if (typeof nestedValue === 'object' && nestedValue !== null && typeof target[nestedKey] === 'object' && target[nestedKey] !== null) {
                      // Check if this is specifically an envelope with ADSR parameters - handle this first
                      if (nestedKey === 'envelope' && (Object.prototype.hasOwnProperty.call(nestedValue, 'attack') || Object.prototype.hasOwnProperty.call(nestedValue, 'decay') || Object.prototype.hasOwnProperty.call(nestedValue, 'sustain') || Object.prototype.hasOwnProperty.call(nestedValue, 'release'))) {
                        console.log(`🔧 Processing envelope parameters: ${nestedPath}`)
                        // For envelope objects, handle each ADSR parameter individually
                        for (const [envParam, envValue] of Object.entries(nestedValue)) {
                          if (target[nestedKey][envParam] !== undefined) {
                            if (typeof target[nestedKey][envParam] === 'object' && target[nestedKey][envParam] !== null && 'value' in target[nestedKey][envParam]) {
                              console.log(`🔧 Setting envelope param ${nestedPath}.${envParam}.value =`, envValue)
                              target[nestedKey][envParam].value = envValue
                            } else {
                              console.log(`🔧 Setting envelope param ${nestedPath}.${envParam} =`, envValue)
                              target[nestedKey][envParam] = envValue
                            }
                          }
                        }
                      } else {
                        // For other nested objects (like oscillator), recurse deeper
                        console.log(`🔧 Processing deeper nested object: ${nestedPath}`)
                        applyNestedSettings(target[nestedKey], nestedValue, nestedPath)
                      }
                    } else if (typeof target[nestedKey] === 'object' && target[nestedKey] !== null && 'value' in target[nestedKey]) {
                      // Tone.js Param (like filter.Q, etc.) - but NOT envelopes which were handled above
                      console.log(`🔧 Setting Tone.js Param ${nestedPath}.value =`, nestedValue)
                      target[nestedKey].value = nestedValue
                    } else {
                      // Direct nested property - check if it's settable
                      try {
                        const descriptor = Object.getOwnPropertyDescriptor(target, nestedKey)
                        if (!descriptor || descriptor.set || descriptor.writable !== false) {
                          console.log(`🔧 Setting direct property ${nestedPath} =`, nestedValue)
                          target[nestedKey] = nestedValue
                        } else {
                          console.warn(`⚠️ Property ${nestedPath} is read-only, skipping`)
                        }
                      } catch (error) {
                        console.warn(`⚠️ Could not set ${nestedPath}:`, error)
                      }
                    }
                  } else {
                    console.warn(`⚠️ Property ${nestedPath} does not exist on target`)
                  }
                }
              }
              
              applyNestedSettings(instance[key], value)
            }
          } else {
            // Handle direct properties
            try {
              instance[key] = value
            } catch (error) {
              console.warn(`⚠️ Could not set ${key}:`, error)
            }
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
  }, [updateNodesRef, initializeNodeInstance])

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
    nodes: nodes,
    createNode,
    updateNodeSettings,
    getNodeById,
    disposeNode,
    getAllNodes,
    clearAllNodes,
    initializeNodeInstance
  }
}