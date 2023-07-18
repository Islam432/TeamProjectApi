import { FileDetails } from '../../file.models'

export interface FileDownloadReqBody {
  downloadInput: string
  path: any
}

export interface DownloadObj {
  action: string
  path: string
  names: string[]
  data: FileDetails[]
  Authorization: string
}
