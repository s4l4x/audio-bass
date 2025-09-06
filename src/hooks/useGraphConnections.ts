import { useState, useCallback, useRef } from 'react'
import type { AudioConnection, NodeInstance, SignalType } from '../types/audioGraph'
import { parseConnectionString, GraphValidation } from '../utils/graphUtils'

// Helper to get the actual Tone.js connection point from a node
const getConnectionPoint = (node: NodeInstance, port: string, isInput: boolean): any => {
  const instance = node.instance
  
  if (!instance) {
    console.warn('⚠️ Node instance is null:', node.id)
    return null
  }
  
  // Handle standard Tone.js connection points
  if (port === 'output' && !isInput) {
    // Most Tone.js objects can be connected directly as outputs
    return instance
  }
  
  if (port === 'input' && isInput) {
    // Most Tone.js objects can be connected directly as inputs
    return instance
  }
  
  // Handle specific named ports (e.g., oscillator.frequency)
  if (instance[port] && typeof instance[port] === 'object') {
    return instance[port]
  }
  
  // Default to the instance itself
  return instance
}

export function useGraphConnections(nodes: Map<string, NodeInstance>) {
  const [, setConnections] = useState<AudioConnection[]>([])
  const connectionsRef = useRef<AudioConnection[]>([])
  const toneConnectionsRef = useRef<Map<string, any>>(new Map()) // Track actual Tone.js connections
  
  // Keep ref in sync with state
  const updateConnectionsRef = useCallback((newConnections: AudioConnection[]) => {
    connectionsRef.current = newConnections
    setConnections([...newConnections])
  }, [])

  // Validate if a connection is possible
  const validateConnection = useCallback((fromStr: string, toStr: string): boolean => {
    const from = parseConnectionString(fromStr)
    const to = parseConnectionString(toStr)
    
    const fromNode = nodes.get(from.nodeId)
    const toNode = nodes.get(to.nodeId)
    
    if (!fromNode || !toNode) {
      console.warn('⚠️ Cannot validate connection - nodes not found:', from.nodeId, to.nodeId)
      return false
    }
    
    if (fromNode.isDisposed || toNode.isDisposed) {
      console.warn('⚠️ Cannot connect disposed nodes:', from.nodeId, to.nodeId)
      return false
    }
    
    // Prevent self-connections using utility
    if (GraphValidation.wouldCreateCycle(fromStr, toStr)) {
      console.warn('⚠️ Cannot connect node to itself:', fromNode.id)
      return false
    }
    
    // Check if connection already exists
    const exists = connectionsRef.current.some(conn => 
      conn.from === fromStr && conn.to === toStr
    )
    
    if (exists) {
      console.warn('⚠️ Connection already exists:', fromStr, '->', toStr)
      return false
    }
    
    return true
  }, [nodes])

  // Create a connection between two nodes
  const connect = useCallback((fromStr: string, toStr: string, signalType: SignalType = 'audio'): boolean => {
    if (!validateConnection(fromStr, toStr)) {
      return false
    }
    
    const from = parseConnectionString(fromStr)
    const to = parseConnectionString(toStr)
    
    const fromNode = nodes.get(from.nodeId)
    const toNode = nodes.get(to.nodeId)
    
    if (!fromNode || !toNode) {
      console.error('❌ Cannot connect - nodes not found:', from.nodeId, to.nodeId)
      return false
    }
    
    try {
      // Get the actual Tone.js connection points
      const sourcePoint = getConnectionPoint(fromNode, from.property, false)
      const destPoint = getConnectionPoint(toNode, to.property, true)
      
      if (!sourcePoint || !destPoint) {
        console.error('❌ Cannot get connection points:', fromStr, toStr)
        return false
      }
      
      // Make the Tone.js connection
      if (typeof sourcePoint.connect === 'function') {
        sourcePoint.connect(destPoint)
        console.log('✅ Connected:', fromStr, '->', toStr)
        
        // Store the connection for later cleanup
        const connectionKey = `${fromStr}->${toStr}`
        toneConnectionsRef.current.set(connectionKey, { source: sourcePoint, dest: destPoint })
      } else {
        console.error('❌ Source point does not support connections:', fromStr)
        return false
      }
      
      // Add to our connection tracking
      const newConnection: AudioConnection = {
        from: fromStr,
        to: toStr,
        signalType
      }
      
      const newConnections = [...connectionsRef.current, newConnection]
      updateConnectionsRef(newConnections)
      
      // Update node input/output tracking
      toNode.inputs.set(to.property, fromNode.id)
      fromNode.outputs.set(from.property, toNode.id)
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to create connection:', fromStr, '->', toStr, error)
      return false
    }
  }, [nodes, validateConnection, updateConnectionsRef])

  // Remove a connection between two nodes
  const disconnect = useCallback((fromStr: string, toStr: string): boolean => {
    const connectionIndex = connectionsRef.current.findIndex(conn => 
      conn.from === fromStr && conn.to === toStr
    )
    
    if (connectionIndex === -1) {
      console.warn('⚠️ Connection not found for disconnect:', fromStr, '->', toStr)
      return false
    }
    
    try {
      // Remove the Tone.js connection
      const connectionKey = `${fromStr}->${toStr}`
      const toneConnection = toneConnectionsRef.current.get(connectionKey)
      
      if (toneConnection && typeof toneConnection.source.disconnect === 'function') {
        toneConnection.source.disconnect(toneConnection.dest)
        toneConnectionsRef.current.delete(connectionKey)
        console.log('✅ Disconnected:', fromStr, '->', toStr)
      }
      
      // Remove from our connection tracking
      const newConnections = [...connectionsRef.current]
      newConnections.splice(connectionIndex, 1)
      updateConnectionsRef(newConnections)
      
      // Update node input/output tracking
      const from = parseConnectionString(fromStr)
      const to = parseConnectionString(toStr)
      
      const fromNode = nodes.get(from.nodeId)
      const toNode = nodes.get(to.nodeId)
      
      if (fromNode) {
        fromNode.outputs.delete(from.property)
      }
      if (toNode) {
        toNode.inputs.delete(to.property)
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to disconnect:', fromStr, '->', toStr, error)
      return false
    }
  }, [nodes, updateConnectionsRef])

  // Disconnect all connections for a specific node
  const disconnectNode = useCallback((nodeId: string) => {
    console.log('🔌 Disconnecting all connections for node:', nodeId)
    
    const connectionsToRemove = connectionsRef.current.filter(conn => {
      const from = parseConnectionString(conn.from)
      const to = parseConnectionString(conn.to)
      return from.nodeId === nodeId || to.nodeId === nodeId
    })
    
    for (const conn of connectionsToRemove) {
      disconnect(conn.from, conn.to)
    }
  }, [disconnect])

  // Get all connections for a specific node
  const getNodeConnections = useCallback((nodeId: string): { inputs: AudioConnection[]; outputs: AudioConnection[] } => {
    const inputs = connectionsRef.current.filter(conn => {
      const to = parseConnectionString(conn.to)
      return to.nodeId === nodeId
    })
    
    const outputs = connectionsRef.current.filter(conn => {
      const from = parseConnectionString(conn.from)
      return from.nodeId === nodeId
    })
    
    return { inputs, outputs }
  }, [])

  // Clear all connections
  const clearAllConnections = useCallback(() => {
    console.log('🧹 Clearing all audio connections')
    
    // Disconnect all Tone.js connections
    for (const [connectionKey, toneConnection] of toneConnectionsRef.current) {
      try {
        if (toneConnection.source && typeof toneConnection.source.disconnect === 'function') {
          toneConnection.source.disconnect(toneConnection.dest)
        }
      } catch (error) {
        console.error('❌ Error disconnecting during clear:', connectionKey, error)
      }
    }
    
    toneConnectionsRef.current.clear()
    updateConnectionsRef([])
    
    // Clear node connection tracking
    for (const node of nodes.values()) {
      node.inputs.clear()
      node.outputs.clear()
    }
  }, [nodes, updateConnectionsRef])

  // Connect multiple connections at once
  const connectMultiple = useCallback((connections: AudioConnection[]): boolean[] => {
    return connections.map(conn => connect(conn.from, conn.to, conn.signalType))
  }, [connect])

  return {
    connections: connectionsRef.current,
    connect,
    disconnect,
    disconnectNode,
    getNodeConnections,
    validateConnection,
    clearAllConnections,
    connectMultiple
  }
}