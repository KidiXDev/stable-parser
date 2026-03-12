import { ImageParameters } from './types'

interface ComfyUINode {
  class_type: string
  inputs: Record<string, unknown>
}

type ComfyUIWorkflow = Record<string, ComfyUINode>

/**
 * Returns true when the provided JSON string looks like a ComfyUI node graph.
 */
export function isComfyUIWorkflow(text: string): boolean {
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
    return Object.values(parsed).some(
      (node) =>
        typeof node === 'object' &&
        node !== null &&
        typeof (node as ComfyUINode).class_type === 'string'
    )
  } catch {
    return false
  }
}

/**
 * Extract generation parameters from a ComfyUI workflow JSON string.
 */
export function extractComfyUIParameters(workflowJson: string): ImageParameters {
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
    const workflow: ComfyUIWorkflow = JSON.parse(workflowJson)

    // Locate the primary sampler node
    const samplerEntry = Object.entries(workflow).find(([, node]) =>
      ['KSampler', 'KSamplerAdvanced'].includes(node.class_type)
    )
    if (!samplerEntry) return result

    const [, sampler] = samplerEntry
    const inputs = sampler.inputs

    result.steps = String(inputs.steps ?? '')
    result.cfgScale = String(inputs.cfg ?? '')
    result.samplingMethod = String(inputs.sampler_name ?? '')
    result.scheduler = String(inputs.scheduler ?? '')
    // KSamplerAdvanced stores the seed in `noise_seed` instead of `seed`
    result.seed = String(inputs.seed ?? inputs.noise_seed ?? '')

    // Positive / negative prompts are referenced by node id
    result.prompt = resolveTextNode(workflow, inputs.positive)
    result.negativePrompt = resolveTextNode(workflow, inputs.negative)

    // Model – follow the model reference to CheckpointLoader node
    const modelNode = resolveNode(workflow, inputs.model)
    if (modelNode) {
      result.model = String(modelNode.inputs.ckpt_name ?? '')
    }

    // Resolution – follow the latent image reference to EmptyLatentImage node
    const latentNode = resolveNode(workflow, inputs.latent_image)
    if (latentNode?.inputs?.width && latentNode?.inputs?.height) {
      result.resolution = `${latentNode.inputs.width}x${latentNode.inputs.height}`
    }
  } catch (error) {
    console.error('Error parsing ComfyUI parameters:', error)
  }

  return result
}

/** Follow a node reference tuple [nodeId, outputIndex] and return the node. */
function resolveNode(workflow: ComfyUIWorkflow, ref: unknown): ComfyUINode | null {
  // ComfyUI node references are tuples: [nodeId: string, outputIndex: number]
  if (!Array.isArray(ref) || typeof ref[0] !== 'string') return null
  return workflow[ref[0]] ?? null
}

/** Follow a node reference and extract the text input from the target node. */
function resolveTextNode(workflow: ComfyUIWorkflow, ref: unknown): string {
  const node = resolveNode(workflow, ref)
  if (!node) return ''
  return String(node.inputs.text ?? '')
}
