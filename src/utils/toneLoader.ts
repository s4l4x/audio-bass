/**
 * Dynamic Tone.js loader to prevent AudioContext warnings on page load
 * Only loads Tone.js when first needed (user interaction)
 */

let toneModule: any = null
let loadingPromise: Promise<any> | null = null

export async function loadTone() {
  // Return cached module if already loaded
  if (toneModule) {
    return toneModule
  }

  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise
  }

  // Start loading Tone.js
  loadingPromise = import('tone').then(module => {
    toneModule = module
    console.log('✅ Tone.js loaded dynamically')
    return module
  })

  return loadingPromise
}

export function getToneModule() {
  return toneModule
}

export function isToneLoaded() {
  return toneModule !== null
}