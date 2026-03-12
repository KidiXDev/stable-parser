# Stable Parser

![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)
[![GitHub downloads count total](https://img.shields.io/github/downloads/KidiXDev/stable-parser/total.svg?logo=github)](https://github.com/KidiXDev/stable-parser/releases)

An Electron application for parsing and extracting metadata from AI-generated images, built with React and TypeScript.

<div align="center">
  <img src="./resources/icon.png" alt="Stable Parser Logo" width="200">
</div>

## Features

- 🖼️ **Image Metadata Extraction**: Extracts prompt, negative prompt, and generation parameters from AI-generated images.
- 🖱️ **Drag and Drop Interface**: Simple drag-and-drop functionality for image files.
- 📋 **Copy to Clipboard**: Easily copy prompts and parameters with a single click.
- 📊 **Image Information**: View detailed image information including resolution, format and size.
- 🎨 **Modern UI**: Clean, responsive interface.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/kidixdev/stable-parser.git
cd stable-parser
```

2. Install dependencies:

```bash
yarn install
```

3. Run the development server:

```bash
yarn dev
```

## Supported Image Types

- JPEG (.jpg, .jpeg)
- PNG (.png)

## Supported AI Tools

| Tool | Status |
|------|--------|
| Stable Diffusion WebUI (A1111) | ✅ Supported |
| ComfyUI | ✅ Supported |

## Technologies Used

- [Electron](https://www.electronjs.org/) - Cross-platform desktop applications
- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [ExifReader](https://github.com/mattiasw/ExifReader) - Image metadata extraction
- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## Development

### Project Structure

```
stable-parser/
├── build/                # Build assets
├── resources/            # Application resources
├── src/
│   ├── main/            # Electron main process code
│   │   └── ipcHandlers/
│   │       ├── utils/
│   │       │   ├── types.ts          # Shared TypeScript types
│   │       │   ├── a1111-parser.ts   # Stable Diffusion WebUI parser
│   │       │   └── comfyui-parser.ts # ComfyUI workflow parser
│   │       └── imageProcessing.ts   # IPC handler & format detection
│   ├── preload/         # Preload scripts
│   └── renderer/        # React frontend code
│       └── src/
│           ├── components/  # React components
│           ├── pages/       # Application pages
│           └── assets/      # Frontend assets
├── electron-builder.yml  # Electron builder config
└── package.json         # Project dependencies and scripts
```

## License

This project is licensed under the GNU General Public License v2.0 - see the [LICENSE](LICENSE) file for details.
