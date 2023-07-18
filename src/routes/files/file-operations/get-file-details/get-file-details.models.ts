import { FileDetails } from '../../file.models'

export interface GetFileDetailsReqBody {
  action: 'details'
  path: string
  names: string[]
  data: FileDetails[]
}
