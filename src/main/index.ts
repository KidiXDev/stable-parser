import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import ExifReader from 'exifreader'
import sharp from 'sharp'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minHeight: 720,
    minWidth: 1280,
    show: false,
    frame: false, // Create a frameless window for custom titlebar
    backgroundColor: '#0f0f0f', // Dark background
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setAspectRatio(16 / 9)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Handle external links
  ipcMain.handle('open-external', (_event, url) => {
    shell.openExternal(url)
  })

  // Image processing IPC handlers
  ipcMain.handle('parse-image', async (_event, { buffer, filename }) => {
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
  })

  // Window control handlers
  ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })

  ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/**
 * Extract A1111/Stable Diffusion parameters from image metadata
 */
interface ExifTag {
  description?: string
  value?: string
  [key: string]: unknown
}

function extractA1111Parameters(tags: Record<string, ExifTag>): {
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
} {
  console.log('Extracting parameters from tags:', Object.keys(tags))

  const result = {
    prompt: '',
    negativePrompt: '',
    samplingMethod: '',
    scheduler: '',
    cfgScale: '',
    steps: '',
    seed: '',
    model: '',
    resolution: '',
    otherParams: {} as Record<string, string>
  }

  try {
    // Look for tags that might contain metadata
    console.log('Available tags:', Object.keys(tags))

    // Check for 'parameters' in the EXIF Description field (typical for A1111)
    if (tags.Description && tags.Description.description) {
      console.log('Found Description tag:', tags.Description.description)
      const description = tags.Description.description

      // Extract prompt
      const promptMatch = description.match(/^(.*?)(?:Negative prompt:|$)/s)
      if (promptMatch) {
        result.prompt = promptMatch[1].trim()
      }

      // Extract negative prompt
      const negativePromptMatch = description.match(/Negative prompt:(.*?)(?:Steps:|$)/s)
      if (negativePromptMatch) {
        result.negativePrompt = negativePromptMatch[1].trim()
      }

      // Extract other parameters (including scheduler)
      const paramsMatch = description.match(
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
        const fallbackParamsMatch = description.match(
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
      const modelMatch = description.match(/Model: ([^,]+)/)
      if (modelMatch) {
        result.model = modelMatch[1].trim()
      }

      // Extract resolution
      const sizeMatch = description.match(/Size: (\d+x\d+)/)
      if (sizeMatch) {
        result.resolution = sizeMatch[1].trim()
      }

      // Extract any additional parameters
      const additionalParams = description.match(/(?:, |^)([^:]+): ([^,]+)(?:,|$)/g)
      if (additionalParams) {
        additionalParams.forEach((param) => {
          const [key, value] = param
            .replace(/^, /, '')
            .replace(/,$/, '')
            .split(': ')
            .map((s) => s.trim())
          if (
            !['Steps', 'Sampler', 'Schedule type', 'CFG scale', 'Seed', 'Model', 'Size'].includes(
              key
            )
          ) {
            result.otherParams[key] = value
          }
        })
      }
    }

    // Try to extract from Comment field
    if (tags.UserComment && tags.UserComment.value) {
      console.log('Found UserComment:', tags.UserComment.value)
      // If don't have a prompt yet, try to parse from UserComment
      if (!result.prompt && typeof tags.UserComment.value === 'string') {
        const userComment = tags.UserComment.value
        const promptMatch = userComment.match(/^(.*?)(?:Negative prompt:|$)/s)
        if (promptMatch) {
          result.prompt = promptMatch[1].trim()
        }

        // Extract negative prompt
        const negativePromptMatch = userComment.match(/Negative prompt:(.*?)(?:Steps:|$)/s)
        if (negativePromptMatch) {
          result.negativePrompt = negativePromptMatch[1].trim()
        }
      }
    }

    // Check for parameters in the XMP data (used by some SD implementations)
    if (tags.parameters && tags.parameters.description) {
      console.log('Found parameters tag:', tags.parameters.description)
      const xmpDescription = tags.parameters.description
      // Parse the same way do with Description
      if (!result.prompt) {
        const promptMatch = xmpDescription.match(/^(.*?)(?:Negative prompt:|$)/s)
        if (promptMatch) {
          result.prompt = promptMatch[1].trim()
        }
      }
    }

    // Check for Automatic1111's "Comment" field which might have parameters
    if (tags.Comment && tags.Comment.description) {
      console.log('Found Comment tag:', tags.Comment.description)
      const comment = tags.Comment.description
      if (!result.prompt) {
        // Similar parsing logic
        const promptMatch = comment.match(/^(.*?)(?:Negative prompt:|$)/s)
        if (promptMatch) {
          result.prompt = promptMatch[1].trim()
        }
      }
    }

    if (tags.parameters && tags.parameters.description) {
      console.log('Found parameters tag:', tags.parameters.description)
      const parametersText = tags.parameters.description

      if (!result.prompt) {
        const promptMatch = parametersText.match(/^(.*?)(?:Negative prompt:|$)/s)
        if (promptMatch) {
          result.prompt = promptMatch[1].trim()
        }
      }

      // Extract negative prompt if don't have it yet
      if (!result.negativePrompt) {
        const negativePromptMatch = parametersText.match(/Negative prompt:(.*?)(?:Steps:|$)/s)
        if (negativePromptMatch) {
          result.negativePrompt = negativePromptMatch[1].trim()
        }
      }

      // Extract other parameters if don't have them yet (including scheduler)
      if (!result.steps || !result.samplingMethod || !result.cfgScale || !result.seed) {
        const paramsMatch = parametersText.match(
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
          const fallbackParamsMatch = parametersText.match(
            /Steps: ([^,]+), Sampler: ([^,]+), CFG scale: ([^,]+), Seed: ([^,]+)(?:, .+)?/
          )
          if (fallbackParamsMatch) {
            result.steps = fallbackParamsMatch[1].trim()
            result.samplingMethod = fallbackParamsMatch[2].trim()
            result.cfgScale = fallbackParamsMatch[3].trim()
            result.seed = fallbackParamsMatch[4].trim()
          }
        }
      }

      // Extract model name if don't have it
      if (!result.model) {
        const modelMatch = parametersText.match(/Model: ([^,]+)/)
        if (modelMatch) {
          result.model = modelMatch[1].trim()
        }
      }

      // Extract resolution if don't have it
      if (!result.resolution) {
        const sizeMatch = parametersText.match(/Size: (\d+x\d+)/)
        if (sizeMatch) {
          result.resolution = sizeMatch[1].trim()
        }
      }
    }
  } catch (error) {
    console.error('Error extracting A1111 parameters:', error)
  }

  return result
}
