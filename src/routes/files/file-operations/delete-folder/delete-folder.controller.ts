import fs from 'fs/promises'
import path from 'path'
import { Request, Response } from 'express'
import { AccessDetails, FileClass } from '../../file.models'
import { StatusCodes } from 'http-status-codes'
import { getPermission } from '../../file.utils'
import { FileManagerDirectoryContent } from '../../file.utils'
import { DeleteFolderReqBody } from './delete-folder.models'

export async function deleteFolder(
  req: Request<{}, {}, DeleteFolderReqBody>,
  res: Response,
  contentRootPath: string,
  accessDetails: AccessDetails | null
) {
  let permission
  let permissionDenied = false
  req.body.data.forEach(function (item) {
    let fromPath = contentRootPath + item.filterPath
    permission = getPermission(fromPath, item.name, item.isFile, contentRootPath, item.filterPath, accessDetails)
    if (permission != null && (!permission.read || !permission.write)) {
      permissionDenied = true
      return res.status(StatusCodes.OK).json({
        error: {
          code: StatusCodes.UNAUTHORIZED.toString(),
          message: item.name + ' is not accessible. You need permission to perform the write action',
        },
      })
    }
  })
  if (!permissionDenied) {
    let promiseList: Promise<FileClass>[] = []
    for (let i = 0; i < req.body.data.length; i++) {
      let newDirectoryPath = path.join(contentRootPath + req.body.data[i].filterPath, req.body.data[i].name)
      if ((await fs.lstat(newDirectoryPath)).isFile()) {
        promiseList.push(FileManagerDirectoryContent(req, res, newDirectoryPath, req.body.data[i].filterPath))
      } else {
        promiseList.push(FileManagerDirectoryContent(req, res, newDirectoryPath + '/', req.body.data[i].filterPath))
      }
    }
    const data = await Promise.all(promiseList)
    for (const item of data) {
      if ((await fs.lstat(path.join(contentRootPath + item.filterPath, item.name))).isFile()) {
        await fs.unlink(path.join(contentRootPath + item.filterPath, item.name))
      } else {
        await fs.rmdir(path.join(contentRootPath + item.filterPath, item.name), { recursive: true })
      }
    }
    return res.status(StatusCodes.OK).json({ files: data })
  }
}
