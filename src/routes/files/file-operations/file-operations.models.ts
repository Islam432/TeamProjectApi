import { FileDetails } from "../file.models"

export interface FileOperationsReqBody {
  action: string
  path: string
  showHiddenItems: boolean
  searchString: string
  caseSensitive: boolean
  data: FileDetails[]
}
