import { ElectronAPI } from '@electron-toolkit/preload'
import {
  ImageMetadata as IMetadata,
  ImageInfo as IInfo,
  ParserType as PType,
  ParseImageResult as PResult
} from './index'

declare global {
  type ImageMetadata = IMetadata
  type ImageInfo = IInfo
  type ParserType = PType
  type ParseImageResult = PResult

  interface Window {
    electron: ElectronAPI
    api: {
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
      }
      openExternal: (url: string) => void
      parseImage: (imageBuffer: ArrayBuffer, filename: string) => Promise<ParseImageResult>
    }
  }
}

export {}
