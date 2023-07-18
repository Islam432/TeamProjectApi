import { FileDetails } from '../../file.models'

export interface CreateFolderReqBody {
  action: 'create'
  path: string
  name: string
  data: FileDetails[]
}
