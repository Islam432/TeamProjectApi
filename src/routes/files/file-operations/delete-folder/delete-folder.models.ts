import { FileDetails } from '../../file.models'

export interface DeleteFolderReqBody {
  action: 'delete'
  path: string
  names: string[]
  data: FileDetails[]
}
