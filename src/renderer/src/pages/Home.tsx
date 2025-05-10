import React, { useState, useEffect } from 'react'
import TitleBar from '../components/TitleBar'
import DropZone from '../components/DropZone'
import MetadataViewer from '../components/MetadataViewer'
import LoadingSpinner from '../components/LoadingSpinner'

interface ParseImageResult {
  success: boolean
  metadata?: {
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
  imageInfo?: {
    width: number
    height: number
    format: string
    size: number
  }
  filename?: string
  error?: string
}

const Home: React.FC = () => {
  const [parseResult, setParseResult] = useState<ParseImageResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleImageDrop = async (file: File): Promise<void> => {
    setIsLoading(true)
    setError(null)

    // Clean up any previous object URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    // Create object URL for preview only (before reading file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    console.log('Preview URL:', objectUrl)

    try {
      const buffer = await file.arrayBuffer()
      const result = await window.api.parseImage(buffer, file.name)

      if (result.success) {
        setParseResult({
          ...result,
          filename: file.name
        })
      } else {
        setError(result.error || 'Failed to extract metadata')
        setParseResult(null)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
      setParseResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-gray-200 select-none">
      <TitleBar />

      <main className="flex flex-col flex-1 p-6 overflow-hidden">
        <h1 className="text-3xl font-semibold mb-1">Stable Parser</h1>
        <p className="text-gray-400 mb-8">Extract metadata from A1111 generated images</p>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-auto">
          {/* Left side - Drop Zone */}
          <div
            className={`w-full ${previewUrl ? 'lg:w-1/3' : 'lg:w-full'} flex flex-col transition-all duration-300`}
          >
            <div className="w-full">
              <DropZone
                onImageDrop={handleImageDrop}
                isLoading={isLoading}
                previewUrl={previewUrl}
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="mt-6 flex flex-col items-center">
                <LoadingSpinner color="primary" size="md" />
                <p className="mt-4 text-gray-400">Processing image...</p>
              </div>
            )}
          </div>{' '}
          <div className={`${!previewUrl ? 'hidden' : 'flex-1'} overflow-y-auto min-h-0 px-8`}>
            {parseResult?.success && parseResult.metadata && (
              <MetadataViewer
                metadata={parseResult.metadata}
                imageInfo={parseResult.imageInfo}
                filename={parseResult.filename}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
        <span>StableParser v1.0</span>
        <a
          href="#"
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
          onClick={() => window.api.openExternal('https://github.com/KidiXDev/stable-parser')}
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}

export default Home
