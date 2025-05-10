import React, { useState } from 'react'

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

interface MetadataViewerProps {
  metadata: ImageMetadata | null
  imageInfo?: ImageInfo
  filename?: string
}

const MetadataViewer: React.FC<MetadataViewerProps> = ({ metadata, imageInfo, filename }) => {
  const [promptCopied, setPromptCopied] = useState(false)
  const [negativePromptCopied, setNegativePromptCopied] = useState(false)

  const copyToClipboard = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ): void => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  if (!metadata) return null

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Image Info */}
      {imageInfo && (
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <div>{filename}</div>
          <div>{`${imageInfo.width} × ${imageInfo.height} • ${imageInfo.format.toUpperCase()}`}</div>
        </div>
      )}

      {/* Prompt */}
      <div className="rounded-lg bg-[#1a1a1a] p-4 border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-200">Prompt</h3>
          <button
            onClick={() => copyToClipboard(metadata.prompt, setPromptCopied)}
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors focus:outline-none"
          >
            {promptCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words select-text">
          {metadata.prompt}
        </p>
      </div>

      {/* Negative Prompt */}
      <div className="rounded-lg bg-[#1a1a1a] p-4 border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-200">Negative Prompt</h3>
          <button
            onClick={() => copyToClipboard(metadata.negativePrompt, setNegativePromptCopied)}
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors focus:outline-none"
          >
            {negativePromptCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words select-text">
          {metadata.negativePrompt}
        </p>
      </div>

      {/* Parameters Grid */}
      <div className="rounded-lg bg-[#1a1a1a] p-4 border border-gray-700">
        <h3 className="text-lg font-medium text-gray-200 mb-4">Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ParamItem label="Model" value={metadata.model} />
          <ParamItem label="Sampling Method" value={metadata.samplingMethod} />
          <ParamItem label="Scheduler" value={metadata.scheduler} />
          <ParamItem label="CFG Scale" value={metadata.cfgScale} />
          <ParamItem label="Steps" value={metadata.steps} />
          <ParamItem label="Seed" value={metadata.seed} />
          <ParamItem
            label="Original Resolution"
            value={(() => {
              const [w, h] = metadata.resolution.split(/[x×]/i).map((v) => parseInt(v.trim(), 10))
              if (isNaN(w) || isNaN(h) || w < 512 || h < 512) {
                return 'Unknown'
              }
              return metadata.resolution
            })()}
          />

          {/* Other Parameters */}
          {Object.entries(metadata.otherParams).map(([key, value]) => (
            <ParamItem key={key} label={key} value={value} />
          ))}
        </div>
      </div>
    </div>
  )
}

const ParamItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded bg-[#25252a] p-3">
    <div className="text-xs text-gray-400 mb-1">{label}</div>
    <div className="text-sm text-gray-200 font-mono truncate select-text" title={value}>
      {value}
    </div>
  </div>
)

export default MetadataViewer
