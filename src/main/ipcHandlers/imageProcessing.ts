import { IpcMain } from 'electron'
import sharp from 'sharp'
import ExifReader from 'exifreader'
import { extractA1111Parameters } from './utils/a1111-parser'
import { extractComfyUIParameters, isComfyUIWorkflow } from './utils/comfyui-parser'
import { ExifTag, ImageParameters } from './utils/types'

export type ParserType = 'a1111' | 'comfyui' | 'unknown'

export interface ImageProcessingResult {
  success: boolean
  metadata?: ImageParameters
  imageInfo?: {
    width: number
    height: number
    format: string
    size: number
  }
  filename?: string
  parserType?: ParserType
  error?: string
}

export function registerImageProcessingHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(
    'parse-image',
    async (_event, { buffer, filename }): Promise<ImageProcessingResult> => {
      try {
        const imageBuffer = Buffer.from(buffer)

        // Get basic image dimensions / format
        let imageInfo: sharp.Metadata
        try {
          imageInfo = await sharp(imageBuffer).metadata()
        } catch {
          return {
            success: false,
            error: 'Failed to process image. The file might be corrupted.'
          }
        }

        // Extract all EXIF / PNG text tags into a flat lookup map
        let tags: Record<string, ExifTag>
        try {
          const rawTags = ExifReader.load(imageBuffer)
          // ExifReader's flat Tags type is a complex intersection – cast via unknown to the
          // simpler Record<string, ExifTag> shape that both parsers expect.
          tags = Object.fromEntries(
            Object.entries(rawTags).filter(([, v]) => v !== null && typeof v === 'object')
          ) as unknown as Record<string, ExifTag>
        } catch {
          return {
            success: false,
            error: 'No metadata found in the image. Is this an AI-generated image?'
          }
        }

        // Promote PNG text chunks (from Sharp) into the tag map
        if (Array.isArray(imageInfo.comments)) {
          for (const chunk of imageInfo.comments) {
            if (chunk.keyword && chunk.text) {
              tags[chunk.keyword] = { description: chunk.text }
            }
          }
        }

        // --- Format detection and parsing ---
        let parameters: ImageParameters
        let parserType: ParserType = 'unknown'

        const promptChunk = tags['prompt']?.description
        if (promptChunk && isComfyUIWorkflow(promptChunk)) {
          parameters = extractComfyUIParameters(promptChunk)
          parserType = 'comfyui'
        } else {
          parameters = extractA1111Parameters(tags)
          parserType = 'a1111'
        }

        return {
          success: true,
          metadata: parameters,
          imageInfo: {
            width: imageInfo.width ?? 0,
            height: imageInfo.height ?? 0,
            format: imageInfo.format ?? '',
            size: buffer.byteLength
          },
          filename,
          parserType
        }
      } catch (error: unknown) {
        console.error('Error parsing image:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  )
}
