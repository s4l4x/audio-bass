import { useState, useCallback, useRef } from 'react'
import type { ModulationRoute, NodeInstance } from '../types/audioGraph'
import { parseParameterPath } from '../utils/graphUtils'

// Helper to get the actual Tone.js parameter from a node
const getParameter = (node: NodeInstance, paramName: string): any => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const instance = node.instance
  
  if (!instance) {
    console.warn('⚠️ Node instance is null:', node.id)
    return null
  }
  
  // Handle nested parameters (e.g., oscillator.frequency)
  const paramParts = paramName.split('.')
  let param = instance
  
  for (const part of paramParts) {
    if (param && param[part] !== undefined) {
      param = param[part]
    } else {
      console.warn('⚠️ Parameter not found:', paramName, 'on node', node.id)
      return null
    }
  }
  
  return param
}

// Helper to set a parameter value on a Tone.js object (currently unused but kept for future modulation features)
// const setParameterValue = (param: any, value: number): boolean => {
//   try {
//     if (param && typeof param === 'object' && 'value' in param) {
//       // Tone.js Param object
//       param.value = value
//       return true
//     } else if (typeof param === 'number') {
//       // Direct numeric property - can't set this way, need to go through parent
//       console.warn('⚠️ Cannot set numeric parameter directly')
//       return false
//     }
//     return false
//   } catch (error) {
//     console.error('❌ Failed to set parameter value:', error)
//     return false
//   }
// }

export function useModulationMatrix(nodes: Map<string, NodeInstance>) {
  const [, setModulationRoutes] = useState<ModulationRoute[]>([])
  const routesRef = useRef<ModulationRoute[]>([])
  const activeModulationsRef = useRef<Map<string, any>>(new Map()) // eslint-disable-line @typescript-eslint/no-explicit-any

  // Keep ref in sync with state  
  const updateRoutesRef = useCallback((newRoutes: ModulationRoute[]) => {
    routesRef.current = newRoutes
    setModulationRoutes([...newRoutes])
  }, [])

  // Add a new modulation route
  const addModulationRoute = useCallback((route: ModulationRoute): boolean => {
    // Check if route already exists
    const exists = routesRef.current.some(r => 
      r.source === route.source && r.destination === route.destination
    )
    
    if (exists) {
      console.warn('⚠️ Modulation route already exists:', route.source, '->', route.destination)
      return false
    }
    
    // Validate source and destination nodes exist
    const sourceParts = parseParameterPath(route.source)
    const destParts = parseParameterPath(route.destination)
    
    const sourceNode = nodes.get(sourceParts.nodeId)
    const destNode = nodes.get(destParts.nodeId)
    
    if (!sourceNode || !destNode) {
      console.error('❌ Cannot create modulation route - nodes not found:', sourceParts.nodeId, destParts.nodeId)
      return false
    }
    
    try {
      // Get the source parameter (CV output)
      const sourceParam = getParameter(sourceNode, sourceParts.property)
      const destParam = getParameter(destNode, destParts.property)
      
      if (!sourceParam || !destParam) {
        console.error('❌ Cannot create modulation route - parameters not found')
        return false
      }
      
      // For now, we'll store the route but not create the actual Tone.js modulation connection
      // Real modulation would require more complex signal routing with Tone.js Signal objects
      const newRoutes = [...routesRef.current, route]
      updateRoutesRef(newRoutes)
      
      console.log('✅ Modulation route added:', route.source, '->', route.destination, 'amount:', route.amount)
      return true
      
    } catch (error) {
      console.error('❌ Failed to add modulation route:', error)
      return false
    }
  }, [nodes, updateRoutesRef])

  // Remove a modulation route
  const removeModulationRoute = useCallback((source: string, destination: string): boolean => {
    const routeIndex = routesRef.current.findIndex(r => 
      r.source === source && r.destination === destination
    )
    
    if (routeIndex === -1) {
      console.warn('⚠️ Modulation route not found for removal:', source, '->', destination)
      return false
    }
    
    try {
      // Remove the route
      const newRoutes = [...routesRef.current]
      newRoutes.splice(routeIndex, 1)
      updateRoutesRef(newRoutes)
      
      // Clean up active modulation if any
      const routeKey = `${source}->${destination}`
      activeModulationsRef.current.delete(routeKey)
      
      console.log('✅ Modulation route removed:', source, '->', destination)
      return true
      
    } catch (error) {
      console.error('❌ Failed to remove modulation route:', error)
      return false
    }
  }, [updateRoutesRef])

  // Apply modulation to a specific node (called when node parameters change)
  const applyModulation = useCallback((nodeId: string) => {
    // Find all modulation routes that target this node
    const targetRoutes = routesRef.current.filter(route => {
      const destParts = parseParameterPath(route.destination)
      return destParts.nodeId === nodeId
    })
    
    for (const route of targetRoutes) {
      try {
        const sourceParts = parseParameterPath(route.source)
        const destParts = parseParameterPath(route.destination)
        
        const sourceNode = nodes.get(sourceParts.nodeId)
        const destNode = nodes.get(destParts.nodeId)
        
        if (!sourceNode || !destNode) continue
        
        // Get current values
        const sourceParam = getParameter(sourceNode, sourceParts.property)
        const destParam = getParameter(destNode, destParts.property)
        
        if (!sourceParam || !destParam) continue
        
        // For simple modulation, we could read the source value and apply it to destination
        // This is a simplified implementation - real modulation would use Tone.js Signal routing
        let sourceValue = 0
        if (sourceParam && typeof sourceParam === 'object' && 'value' in sourceParam) {
          sourceValue = sourceParam.value
        }
        
        // Apply modulation scaling
        const modulatedValue = sourceValue * route.amount
        
        // Apply scale range if provided
        if (route.scale) {
          const [min, max] = route.scale
          const scaledValue = min + (modulatedValue * (max - min))
          // Here we would apply scaledValue to the destination parameter
          // For now, just log it
          console.log('🎛️ Modulation applied:', route.source, '->', route.destination, 'value:', scaledValue)
        }
        
      } catch (error) {
        console.error('❌ Failed to apply modulation:', route, error)
      }
    }
  }, [nodes])

  // Update modulation amount for an existing route
  const updateModulationAmount = useCallback((source: string, destination: string, newAmount: number): boolean => {
    const routeIndex = routesRef.current.findIndex(r => 
      r.source === source && r.destination === destination
    )
    
    if (routeIndex === -1) {
      console.warn('⚠️ Modulation route not found for update:', source, '->', destination)
      return false
    }
    
    const newRoutes = [...routesRef.current]
    newRoutes[routeIndex] = { ...newRoutes[routeIndex], amount: newAmount }
    updateRoutesRef(newRoutes)
    
    console.log('✅ Modulation amount updated:', source, '->', destination, 'new amount:', newAmount)
    return true
  }, [updateRoutesRef])

  // Get all modulation routes for a specific node
  const getNodeModulationRoutes = useCallback((nodeId: string): { sources: ModulationRoute[]; targets: ModulationRoute[] } => {
    const sources = routesRef.current.filter(route => {
      const sourceParts = parseParameterPath(route.source)
      return sourceParts.nodeId === nodeId
    })
    
    const targets = routesRef.current.filter(route => {
      const destParts = parseParameterPath(route.destination)
      return destParts.nodeId === nodeId
    })
    
    return { sources, targets }
  }, [])

  // Clear all modulation routes
  const clearAllModulationRoutes = useCallback(() => {
    console.log('🧹 Clearing all modulation routes')
    
    // Clear active modulations
    activeModulationsRef.current.clear()
    updateRoutesRef([])
  }, [updateRoutesRef])

  // Remove all modulation routes for a specific node
  const removeNodeModulationRoutes = useCallback((nodeId: string) => {
    console.log('🔌 Removing all modulation routes for node:', nodeId)
    
    const newRoutes = routesRef.current.filter(route => {
      const sourceParts = parseParameterPath(route.source)
      const destParts = parseParameterPath(route.destination)
      return sourceParts.nodeId !== nodeId && destParts.nodeId !== nodeId
    })
    
    updateRoutesRef(newRoutes)
  }, [updateRoutesRef])

  return {
    modulationRoutes: routesRef.current,
    addModulationRoute,
    removeModulationRoute,
    applyModulation,
    updateModulationAmount,
    getNodeModulationRoutes,
    clearAllModulationRoutes,
    removeNodeModulationRoutes
  }
}