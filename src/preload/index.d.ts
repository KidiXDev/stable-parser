import { ElectronAPI } from '@electron-toolkit/preload'

// Metadata types
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

type ParserType = 'a1111' | 'comfyui' | 'unknown'

interface ParseImageResult {
  success: boolean
  metadata?: ImageMetadata
  imageInfo?: ImageInfo
  filename?: string
  parserType?: ParserType
  error?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
      }
      openExternal: (url: string) => void
      parseImage: (imageBuffer: ArrayBuffer, filename: string) => Promise<ParseImageResult>
    }
  }
}
