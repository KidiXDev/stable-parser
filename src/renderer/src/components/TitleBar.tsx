import React from 'react'

const TitleBar: React.FC = () => {
  const handleMinimize = (): void => {
    window.api.window.minimize()
  }

  const handleMaximize = (): void => {
    window.api.window.maximize()
  }

  const handleClose = (): void => {
    window.api.window.close()
  }

  return (
    <div className="h-10 bg-[#1a1a1a] flex items-center justify-between select-none drag">
      <div className="flex items-center ml-4 space-x-2 no-drag">
        <img src="/icon.png" alt="App Logo" className="w-5 h-5 rounded-full" />
        <span className="text-gray-300 font-medium">StableParser</span>
      </div>
      <div className="flex no-drag">
        <button
          onClick={handleMinimize}
          className="px-4 h-10 hover:bg-[#303030] text-gray-400 flex items-center justify-center focus:outline-none transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="6" width="10" height="1" fill="currentColor" />
          </svg>
        </button>{' '}
        <button
          onClick={handleMaximize}
          className="px-4 h-10 hover:bg-[#303030] text-gray-400 flex items-center justify-center focus:outline-none transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              stroke="currentColor"
              fill="none"
              strokeWidth="1"
            />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="px-4 h-10 hover:bg-red-600 text-gray-400 hover:text-white flex items-center justify-center focus:outline-none transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1" />
            <line x1="1" y1="11" x2="11" y2="1" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TitleBar
