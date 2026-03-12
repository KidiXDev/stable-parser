import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface ImageMetadata {
  prompt: string
  negativePrompt: string
  samplingMethod: string
  scheduler: string
  cfgScale: string
  steps: string
  seed: string
  model: string
  resolution: string
  otherParams: Record<string, string>
}

export interface ImageInfo {
  width: number
  height: number
  format: string
  size: number
}

export type ParserType = 'a1111' | 'comfyui' | 'unknown'

export interface ParseImageResult {
  success: boolean
  metadata?: ImageMetadata
  imageInfo?: ImageInfo
  filename?: string
  parserType?: ParserType
  error?: string
}

const api = {
  // Window control
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
  },
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  // Image processing
  parseImage: (imageBuffer: ArrayBuffer, filename: string): Promise<ParseImageResult> =>
    ipcRenderer.invoke('parse-image', { buffer: imageBuffer, filename })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
