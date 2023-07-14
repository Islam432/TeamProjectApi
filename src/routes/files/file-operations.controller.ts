import { FileManagerDirectoryContent } from './file.utils'
import path from 'path'
import { CONTENT_ROOT_PATH } from './file.constants'
import { UnauthorizedError } from '../../errors'
import { StatusCodes } from 'http-status-codes'
import {
  CopyFiles,
  getFileDetails,
  getRules,
  fromDir,
  ReadDirectories,
  GetFiles,
  MoveFiles,
  createFolder,
  deleteFolder,
  renameFolder,
} from './file-operations.utils'

export async function fileOperations(req, res) {
  req.setTimeout(0)

  const accessDetails = await getRules()

  // Action for getDetails
  if (req.body.action == 'details') {
    await getFileDetails(req, res, CONTENT_ROOT_PATH + req.body.path, req.body.data[0].filterPath)
  }
  // Action for copying files
  if (req.body.action == 'copy') {
    await CopyFiles(req, res, CONTENT_ROOT_PATH, accessDetails)
  }
  // Action for movinh files
  if (req.body.action == 'move') {
    await MoveFiles(req, res, CONTENT_ROOT_PATH, accessDetails)
  }
  // Action to create a new folder
  if (req.body.action == 'create') {
    await createFolder(req, res, CONTENT_ROOT_PATH + req.body.path, CONTENT_ROOT_PATH, accessDetails)
  }
  // Action to remove a file
  if (req.body.action == 'delete') {
    await deleteFolder(req, res, CONTENT_ROOT_PATH, accessDetails)
  }
  // Action to rename a file
  if (req.body.action === 'rename') {
    await renameFolder(req, res, CONTENT_ROOT_PATH + req.body.path, accessDetails)
  }

  // Action to search a file
  if (req.body.action === 'search') {
    let fileList = []
    fromDir(
      CONTENT_ROOT_PATH + req.body.path,
      req.body.searchString.replace(/\*/g, ''),
      CONTENT_ROOT_PATH,
      req.body.caseSensitive,
      req.body.searchString,
      fileList,
      accessDetails
    )
    ;(async () => {
      const tes = await FileManagerDirectoryContent(req, res, CONTENT_ROOT_PATH + req.body.path, accessDetails!)
      if (tes.permission != null && !tes.permission.read) {
        throw new UnauthorizedError(
          tes.permission.message ||
            req.body.path + ' is not accessible. You need permission to perform the read action.'
        )
      } else {
        return res.status(StatusCodes.OK).contentType('application/json').json({ cwd: tes, files: fileList })
      }
    })()
  }

  // Action to read a file
  if (req.body.action == 'read') {
    ;(async () => {
      const filesList = await GetFiles(req, res)
      const cwdFiles = await FileManagerDirectoryContent(req, res, CONTENT_ROOT_PATH + req.body.path, accessDetails!)
      cwdFiles.name = path.basename(CONTENT_ROOT_PATH + req.body.path)
      if (cwdFiles.permission != null && !cwdFiles.permission.read) {
        throw new UnauthorizedError(
          cwdFiles.permission.message ||
            cwdFiles.name + ' is not accessible. You need permission to perform the read action.'
        )
      } else {
        ReadDirectories(filesList, req, accessDetails).then((data) => {
          return res.status(StatusCodes.OK).json({ cwd: cwdFiles, files: data })
        })
      }
    })()
  }
}
