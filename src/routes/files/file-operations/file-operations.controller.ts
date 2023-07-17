import { FileManagerDirectoryContent, getRules } from '../file.utils'
import path from 'path'
import { CONTENT_ROOT_PATH } from '../file.constants'
import { UnauthorizedError } from '../../../errors'
import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { FileOperationsReqBody } from './file-operations.models'
import { getFileDetails } from './get-file-details/get-file-details.controller'
import {
  CopyFiles,
  fromDir,
  ReadDirectories,
  GetFiles,
  MoveFiles,
  createFolder,
  deleteFolder,
  renameFolder,
} from './file-operations.utils'

function delay(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

export async function fileOperations(req: Request<{}, {}, FileOperationsReqBody>, res: Response) {
  await delay(0)
  const accessDetails = await getRules(req, res)

  // Action for getDetails
  if (req.body.action == 'details') {
    return await getFileDetails(req, res, CONTENT_ROOT_PATH + req.body.path, req.body.data[0].filterPath)
  }
  // Action for copying files
  if (req.body.action == 'copy') {
    return await CopyFiles(req, res, CONTENT_ROOT_PATH, accessDetails)
  }
  // Action for movinh files
  if (req.body.action == 'move') {
    return await MoveFiles(req, res, CONTENT_ROOT_PATH, accessDetails)
  }
  // Action to create a new folder
  if (req.body.action == 'create') {
    return await createFolder(req, res, CONTENT_ROOT_PATH + req.body.path, CONTENT_ROOT_PATH, accessDetails)
  }
  // Action to remove a file
  if (req.body.action == 'delete') {
    return await deleteFolder(req, res, CONTENT_ROOT_PATH, accessDetails)
  }
  // Action to rename a file
  if (req.body.action === 'rename') {
    return await renameFolder(req, res, CONTENT_ROOT_PATH + req.body.path, accessDetails)
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
        // TODO implement permissions
        throw new UnauthorizedError(
          cwdFiles.permission.message ||
            cwdFiles.name + ' is not accessible. You need permission to perform the read action.'
        )
      } else {
        const data = await ReadDirectories(filesList, req, accessDetails)
        return res.status(StatusCodes.OK).json({ cwd: cwdFiles, files: data })
      }
    })()
  }
}
