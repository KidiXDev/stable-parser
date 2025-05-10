import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerImageProcessingHandlers } from './ipcHandlers/imageProcessing'
import { registerWindowControlHandlers } from './ipcHandlers/windowControl'

let mainWindow: BrowserWindow | null = null

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('Another instance is already running. Quitting.')
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    console.log('Second instance detected:', { commandLine, workingDirectory })
  })

  app.whenReady().then(createWindow)
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
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

  // Register IPC handlers
  registerImageProcessingHandlers(ipcMain)
  registerWindowControlHandlers(ipcMain)

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
