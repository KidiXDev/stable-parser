import React, { useState, useRef, useEffect } from 'react'

interface DropZoneProps {
  onImageDrop: (file: File) => void
  isLoading: boolean
  previewUrl?: string
}

const DropZone: React.FC<DropZoneProps> = ({ onImageDrop, isLoading, previewUrl }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImageError(false)
  }, [previewUrl])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png']
    if (!validTypes.includes(file.type)) {
      alert('Only JPG/PNG files are supported!')
      return false
    }
    return true
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        onImageDrop(file)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        onImageDrop(file)
      }
    }
  }

  const handleClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-full p-10 border-2 border-dashed rounded-lg transition-all duration-200 ${
        isDragging
          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
          : 'border-gray-600 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-400/10'
      } cursor-pointer ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ minHeight: 0 }}
    >
      {' '}
      <input
        type="file"
        className="hidden"
        accept="image/png, image/jpeg"
        onChange={handleFileInput}
        ref={fileInputRef}
      />
      {previewUrl ? (
        <div
          className="relative w-full max-w-xs mb-4 rounded-lg overflow-hidden border-4 border-indigo-500/30 flex justify-center items-center"
          style={{ minHeight: 160 }}
        >
          {!imageError ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto max-h-80 object-contain bg-black"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-red-400 text-center w-full">Image preview failed to load.</div>
          )}
        </div>
      ) : (
        <svg
          className={`w-16 h-16 mb-4 text-gray-400 ${isDragging ? 'text-indigo-400' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
      <p className="mb-2 text-lg font-semibold text-gray-300">
        {previewUrl
          ? 'Drop another image or click to browse'
          : isLoading
            ? 'Processing image...'
            : 'Drop A1111 image here'}
      </p>
      <p className="text-sm text-gray-400">
        {isLoading ? 'Please wait while we extract metadata' : 'PNG or JPG files only'}
      </p>
    </div>
  )
}

export default DropZone
