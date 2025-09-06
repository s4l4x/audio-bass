// Graph utility functions for the audio graph system

// Type definitions for parsed node paths
export interface ParsedNodePath {
  nodeId: string
  property: string
}

// Default property names for different contexts
export const DEFAULT_PROPERTIES = {
  CONNECTION_OUTPUT: 'output',
  CONNECTION_INPUT: 'input', 
  PARAMETER: 'value'
} as const

/**
 * Parse a dot-notation path into node ID and property name
 * Examples:
 * - "osc1.output" -> {nodeId: "osc1", property: "output"}
 * - "filter.cutoff" -> {nodeId: "filter", property: "cutoff"} 
 * - "gain" -> {nodeId: "gain", property: defaultProperty}
 */
export function parseNodePath(path: string, defaultProperty: string = DEFAULT_PROPERTIES.PARAMETER): ParsedNodePath {
  const parts = path.split('.')
  
  if (parts.length === 1) {
    return {
      nodeId: parts[0],
      property: defaultProperty
    }
  }
  
  if (parts.length === 2) {
    return {
      nodeId: parts[0],
      property: parts[1]
    }
  }
  
  // Handle nested properties (e.g., "synth.oscillator.frequency")
  // Take first part as nodeId, join rest as property path
  return {
    nodeId: parts[0],
    property: parts.slice(1).join('.')
  }
}

/**
 * Parse a connection string for audio/CV routing
 * Defaults to 'output' property if no property specified
 */
export function parseConnectionString(connectionStr: string): ParsedNodePath {
  return parseNodePath(connectionStr, DEFAULT_PROPERTIES.CONNECTION_OUTPUT)
}

/**
 * Parse a parameter path for modulation routing  
 * Defaults to 'value' property if no property specified
 */
export function parseParameterPath(paramPath: string): ParsedNodePath {
  return parseNodePath(paramPath, DEFAULT_PROPERTIES.PARAMETER)
}

/**
 * Validate that a node path string is properly formatted
 */
export function isValidNodePath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false
  }
  
  const trimmed = path.trim()
  if (trimmed.length === 0) {
    return false
  }
  
  // Check for valid characters (alphanumeric, dots, underscores, hyphens)
  const validPathRegex = /^[a-zA-Z0-9._-]+$/
  return validPathRegex.test(trimmed)
}

/**
 * Create a node path string from components
 */
export function createNodePath(nodeId: string, property?: string): string {
  if (!property) {
    return nodeId
  }
  return `${nodeId}.${property}`
}

/**
 * Extract all node IDs referenced in a list of paths
 */
export function extractNodeIds(paths: string[]): string[] {
  const nodeIds = new Set<string>()
  
  for (const path of paths) {
    if (isValidNodePath(path)) {
      const parsed = parseNodePath(path)
      nodeIds.add(parsed.nodeId)
    }
  }
  
  return Array.from(nodeIds)
}

/**
 * Check if two node paths reference the same node (ignoring property)
 */
export function isSameNode(path1: string, path2: string): boolean {
  const parsed1 = parseNodePath(path1)
  const parsed2 = parseNodePath(path2)
  return parsed1.nodeId === parsed2.nodeId
}

/**
 * Graph validation utilities
 */
export const GraphValidation = {
  /**
   * Check if a connection would create a cycle
   * Simple check - more sophisticated cycle detection could be added later
   */
  wouldCreateCycle(from: string, to: string): boolean {
    // Basic check: prevent direct self-connections
    return isSameNode(from, to)
  },
  
  /**
   * Validate connection endpoint format
   */
  isValidConnectionEndpoint(endpoint: string): boolean {
    return isValidNodePath(endpoint)
  },
  
  /**
   * Validate parameter path format  
   */
  isValidParameterPath(paramPath: string): boolean {
    return isValidNodePath(paramPath)
  }
}