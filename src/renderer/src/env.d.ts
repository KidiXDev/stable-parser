/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vite/client" />

interface Window {
  electron: ElectronAPI
  api: {
    // Window control
    window: {
      minimize: () => void
      maximize: () => void
      close: () => void
    }
    // Image processing
    parseImage: (imageBuffer: ArrayBuffer, filename: string) => Promise<ParseImageResult>
    openExternal: (url: string) => void
  }
}

interface ElectronAPI {
  ipcRenderer: {
    send(channel: string, ...args: any[]): void
    on(channel: string, listener: (event: any, ...args: any[]) => void): void
    once(channel: string, listener: (event: any, ...args: any[]) => void): void
    removeListener(channel: string, listener: (event: any, ...args: any[]) => void): void
    removeAllListeners(channel: string): void
    invoke(channel: string, ...args: any[]): Promise<any>
  }
}

interface ImageMetadata {
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

interface ImageInfo {
  width: number
  height: number
  format: string
  size: number
}

interface ParseImageResult {
  success: boolean
  metadata?: ImageMetadata
  imageInfo?: ImageInfo
  filename?: string
  error?: string
}
