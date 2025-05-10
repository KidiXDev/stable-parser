export interface ExifTag {
  description?: string
  value?: string
  [key: string]: unknown
}

export interface A1111Parameters {
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

/**
 * Extract A1111/Stable Diffusion parameters from image metadata
 */
export function extractA1111Parameters(tags: Record<string, ExifTag>): A1111Parameters {
  console.log('Extracting parameters from tags:', Object.keys(tags))

  const result: A1111Parameters = {
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
    // Look for tags that might contain metadata
    console.log('Available tags:', Object.keys(tags))

    // Check for 'parameters' in the EXIF Description field (typical for A1111)
    if (tags.Description && tags.Description.description) {
      console.log('Found Description tag:', tags.Description.description)
      const description = tags.Description.description

      // Extract prompt
      extractPromptFromText(description, result)

      // Extract other parameters (including scheduler)
      extractParametersFromText(description, result)

      // Extract additional parameters
      extractAdditionalParametersFromText(description, result)
    }

    // Try to extract from Comment field
    if (tags.UserComment && tags.UserComment.value) {
      console.log('Found UserComment:', tags.UserComment.value)
      // If don't have a prompt yet, try to parse from UserComment
      if (!result.prompt && typeof tags.UserComment.value === 'string') {
        extractPromptFromText(tags.UserComment.value, result)
      }
    }

    // Check for parameters in the XMP data (used by some SD implementations)
    if (tags.parameters && tags.parameters.description) {
      processParametersTag(tags.parameters.description, result)
    }

    // Check for Automatic1111's "Comment" field which might have parameters
    if (tags.Comment && tags.Comment.description) {
      console.log('Found Comment tag:', tags.Comment.description)
      if (!result.prompt) {
        extractPromptFromText(tags.Comment.description, result)
      }
    }
  } catch (error) {
    console.error('Error extracting A1111 parameters:', error)
  }

  return result
}

function extractPromptFromText(text: string, result: A1111Parameters): void {
  // Extract prompt
  const promptMatch = text.match(/^(.*?)(?:Negative prompt:|$)/s)
  if (promptMatch) {
    result.prompt = promptMatch[1].trim()
  }

  // Extract negative prompt
  const negativePromptMatch = text.match(/Negative prompt:(.*?)(?:Steps:|$)/s)
  if (negativePromptMatch) {
    result.negativePrompt = negativePromptMatch[1].trim()
  }
}

function extractParametersFromText(text: string, result: A1111Parameters): void {
  // Extract other parameters (including scheduler)
  const paramsMatch = text.match(
    /Steps: ([^,]+), Sampler: ([^,]+), Schedule type: ([^,]+), CFG scale: ([^,]+), Seed: ([^,]+)(?:, .+)?/
  )

  if (paramsMatch) {
    result.steps = paramsMatch[1].trim()
    result.samplingMethod = paramsMatch[2].trim()
    result.scheduler = paramsMatch[3].trim()
    result.cfgScale = paramsMatch[4].trim()
    result.seed = paramsMatch[5].trim()
  } else {
    // fallback to old format if scheduler is missing
    const fallbackParamsMatch = text.match(
      /Steps: ([^,]+), Sampler: ([^,]+), CFG scale: ([^,]+), Seed: ([^,]+)(?:, .+)?/
    )
    if (fallbackParamsMatch) {
      result.steps = fallbackParamsMatch[1].trim()
      result.samplingMethod = fallbackParamsMatch[2].trim()
      result.cfgScale = fallbackParamsMatch[3].trim()
      result.seed = fallbackParamsMatch[4].trim()
    }
  }

  // Extract model name
  const modelMatch = text.match(/Model: ([^,]+)/)
  if (modelMatch) {
    result.model = modelMatch[1].trim()
  }

  // Extract resolution
  const sizeMatch = text.match(/Size: (\d+x\d+)/)
  if (sizeMatch) {
    result.resolution = sizeMatch[1].trim()
  }
}

function extractAdditionalParametersFromText(text: string, result: A1111Parameters): void {
  const additionalParams = text.match(/(?:, |^)([^:]+): ([^,]+)(?:,|$)/g)
  if (additionalParams) {
    additionalParams.forEach((param) => {
      const [key, value] = param
        .replace(/^, /, '')
        .replace(/,$/, '')
        .split(': ')
        .map((s) => s.trim())
      if (
        !['Steps', 'Sampler', 'Schedule type', 'CFG scale', 'Seed', 'Model', 'Size'].includes(key)
      ) {
        result.otherParams[key] = value
      }
    })
  }
}

function processParametersTag(parametersText: string, result: A1111Parameters): void {
  console.log('Found parameters tag:', parametersText)

  if (!result.prompt) {
    extractPromptFromText(parametersText, result)
  }

  // Extract other parameters if don't have them yet
  if (!result.steps || !result.samplingMethod || !result.cfgScale || !result.seed) {
    extractParametersFromText(parametersText, result)
  }
}
