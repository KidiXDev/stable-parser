export interface ExifTag {
  description?: string
  value?: string
  [key: string]: unknown
}

export interface ImageParameters {
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
