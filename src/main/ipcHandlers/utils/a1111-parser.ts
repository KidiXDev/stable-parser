import { ExifTag, ImageParameters } from './types'

/**
 * Extract A1111 / Stable Diffusion WebUI parameters from EXIF tags.
 */
export function extractA1111Parameters(tags: Record<string, ExifTag>): ImageParameters {
  const result: ImageParameters = {
    prompt: '',
    negativePrompt: '',
    samplingMethod: '',
    scheduler: '',
    cfgScale: '',
    steps: '',
    seed: '',
    model: '',
    resolution: '',
    otherParams: {}
  }

  try {
    // Primary: EXIF Description field (typical for A1111 JPEG/PNG)
    if (tags.Description?.description) {
      parseParameterBlock(tags.Description.description, result)
    }

    // Secondary: PNG "parameters" text chunk (injected by imageProcessing before calling here)
    if (tags.parameters?.description) {
      if (!result.prompt) extractPromptFromText(tags.parameters.description, result)
      if (!result.steps || !result.samplingMethod || !result.cfgScale || !result.seed) {
        extractParametersFromText(tags.parameters.description, result)
      }
    }

    // Fallback: EXIF UserComment
    if (tags.UserComment?.value && !result.prompt && typeof tags.UserComment.value === 'string') {
      extractPromptFromText(tags.UserComment.value, result)
    }

    // Fallback: EXIF Comment
    if (tags.Comment?.description && !result.prompt) {
      parseParameterBlock(tags.Comment.description, result)
    }
  } catch (error) {
    console.error('Error extracting A1111 parameters:', error)
  }

  return result
}

function parseParameterBlock(text: string, result: ImageParameters): void {
  extractPromptFromText(text, result)
  extractParametersFromText(text, result)
  extractAdditionalParametersFromText(text, result)
}

function extractPromptFromText(text: string, result: ImageParameters): void {
  const promptMatch = text.match(/^(.*?)(?:Negative prompt:|$)/s)
  if (promptMatch) result.prompt = promptMatch[1].trim()

  const negativeMatch = text.match(/Negative prompt:(.*?)(?:Steps:|$)/s)
  if (negativeMatch) result.negativePrompt = negativeMatch[1].trim()
}

function extractParametersFromText(text: string, result: ImageParameters): void {
  // With scheduler field (newer A1111 / AUTOMATIC1111 format)
  const withScheduler = text.match(
    /Steps: ([^,]+), Sampler: ([^,]+), Schedule type: ([^,]+), CFG scale: ([^,]+), Seed: ([^,]+)/
  )
  if (withScheduler) {
    result.steps = withScheduler[1].trim()
    result.samplingMethod = withScheduler[2].trim()
    result.scheduler = withScheduler[3].trim()
    result.cfgScale = withScheduler[4].trim()
    result.seed = withScheduler[5].trim()
  } else {
    // Older A1111 format without scheduler
    const withoutScheduler = text.match(
      /Steps: ([^,]+), Sampler: ([^,]+), CFG scale: ([^,]+), Seed: ([^,]+)/
    )
    if (withoutScheduler) {
      result.steps = withoutScheduler[1].trim()
      result.samplingMethod = withoutScheduler[2].trim()
      result.cfgScale = withoutScheduler[3].trim()
      result.seed = withoutScheduler[4].trim()
    }
  }

  const modelMatch = text.match(/Model: ([^,]+)/)
  if (modelMatch) result.model = modelMatch[1].trim()

  const sizeMatch = text.match(/Size: (\d+x\d+)/)
  if (sizeMatch) result.resolution = sizeMatch[1].trim()
}

function extractAdditionalParametersFromText(text: string, result: ImageParameters): void {
  const KNOWN_KEYS = ['Steps', 'Sampler', 'Schedule type', 'CFG scale', 'Seed', 'Model', 'Size']

  const matches = text.match(/(?:, |^)([^:]+): ([^,]+)(?:,|$)/g)
  if (!matches) return

  matches.forEach((param) => {
    const parts = param
      .replace(/^, /, '')
      .replace(/,$/, '')
      .split(': ')
      .map((s) => s.trim())
    const key = parts[0]
    const value = parts[1]
    if (key && value !== undefined && !KNOWN_KEYS.includes(key)) {
      result.otherParams[key] = value
    }
  })
}
