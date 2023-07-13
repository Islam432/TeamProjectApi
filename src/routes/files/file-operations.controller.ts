import { GetFiles } from './file-operations.utils'
import { ReadDirectories } from './file-operations.utils'
import { FileManagerDirectoryContent } from './file.utils'
import { fromDir } from './file-operations.utils'
import path from 'path'
import { getRules } from './file-operations.utils'
import { CONTENT_ROOT_PATH } from './file.constants'
import { UnauthorizedError } from '../../errors'
import { StatusCodes } from 'http-status-codes'

export function fileOperations(req, res) {
  req.setTimeout(0)

  const accessDetails = getRules()

  // Action for getDetails
  if (req.body.action == 'details') {
    getFileDetails(req, res, CONTENT_ROOT_PATH + req.body.path, req.body.data[0].filterPath)
  }
  // Action for copying files
  if (req.body.action == 'copy') {
    CopyFiles(req, res, CONTENT_ROOT_PATH)
  }
  // Action for movinh files
  if (req.body.action == 'move') {
    MoveFiles(req, res, CONTENT_ROOT_PATH)
  }
  // Action to create a new folder
  if (req.body.action == 'create') {
    createFolder(req, res, CONTENT_ROOT_PATH + req.body.path, CONTENT_ROOT_PATH)
  }
  // Action to remove a file
  if (req.body.action == 'delete') {
    deleteFolder(req, res, CONTENT_ROOT_PATH)
  }
  // Action to rename a file
  if (req.body.action === 'rename') {
    renameFolder(req, res, CONTENT_ROOT_PATH + req.body.path)
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
      fileList
    )
    ;(async () => {
      const tes = await FileManagerDirectoryContent(req, res, CONTENT_ROOT_PATH + req.body.path)
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
      const cwdFiles = await FileManagerDirectoryContent(req, res, CONTENT_ROOT_PATH + req.body.path)
      cwdFiles.name = path.basename(CONTENT_ROOT_PATH + req.body.path)
      let response = {}
      if (cwdFiles.permission != null && !cwdFiles.permission.read) {
        throw new UnauthorizedError(
          cwdFiles.permission.message ||
            cwdFiles.name + ' is not accessible. You need permission to perform the read action.'
        )
      } else {
        ReadDirectories(filesList, req).then((data) => {
          response = { cwd: cwdFiles, files: data }
          response = JSON.stringify(response)
          res.setHeader('Content-Type', 'application/json')
          res.json(response)
        })
      }
    })()
  }
}
