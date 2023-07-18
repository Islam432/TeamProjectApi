import { FileDetails } from '../../file.models'

export interface GetFileDetailsReqBody {
  action: string
  path: string
  names: string[]
  data: FileDetails[]
}
