import { FileDetails } from '../file.models'

export interface FileOperationsReqBody {
  action: 'details' | 'create' | 'copy' | 'move' | 'delete' | 'rename' | 'search' | 'read'
  path: string
  showHiddenItems: boolean
  searchString: string
  caseSensitive: boolean
  data: FileDetails[]
  names: string[]
  name: string
}
