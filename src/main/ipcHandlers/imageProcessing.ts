import { IpcMain } from 'electron'
import sharp from 'sharp'
import ExifReader from 'exifreader'
import { extractA1111Parameters } from './utils/parser'

export interface ImageProcessingResult {
  success: boolean
  metadata?: ReturnType<typeof extractA1111Parameters>
  imageInfo?: {
    width: number
    height: number
    format: string
    size: number
  }
  filename?: string
  error?: string
}

export function registerImageProcessingHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(
    'parse-image',
    async (_event, { buffer, filename }): Promise<ImageProcessingResult> => {
      try {
        // Use the provided buffer to create a proper Node.js Buffer
        const imageBuffer = Buffer.from(buffer)

        console.log('Received image buffer of size:', imageBuffer.length)

        // Get basic image info using Sharp
        let imageInfo
        try {
          imageInfo = await sharp(imageBuffer).metadata()
          console.log('Sharp metadata:', imageInfo)
        } catch (error) {
          console.error('Error getting image metadata:', error)
          return {
            success: false,
            error: 'Failed to process image. The file might be corrupted.'
          }
        }

        // Extract EXIF data (which may contain A1111 parameters)
        let tags
        try {
          tags = ExifReader.load(imageBuffer, { expanded: true })
          console.log('Found tags:', Object.keys(tags))
        } catch (error) {
          console.error('Error extracting EXIF data:', error)
          return {
            success: false,
            error: 'No metadata found in the image. Is this an A1111 generated image?'
          }
        }

        // Handle PNG text chunks which might contain parameters (common in PNG saved from A1111)
        if (tags.pngText && Array.isArray(imageInfo.comments)) {
          console.log('Found PNG text chunks:', imageInfo.comments)

          // Look for parameters in PNG text chunks
          const parametersChunk = imageInfo.comments.find((chunk) => chunk.keyword === 'parameters')
          if (parametersChunk && parametersChunk.text) {
            console.log('Found parameters text chunk:', parametersChunk.text)
            // Store this in tags so our extraction function can process it
            tags.parameters = { description: parametersChunk.text }
          }
        }

        // Extract A1111 metadata
        const parameters = extractA1111Parameters(tags)

        return {
          success: true,
          metadata: parameters,
          imageInfo: {
            width: imageInfo.width,
            height: imageInfo.height,
            format: imageInfo.format,
            size: buffer.byteLength
          },
          filename: filename
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
