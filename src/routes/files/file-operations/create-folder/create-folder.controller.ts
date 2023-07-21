import fs from 'fs/promises'
import path from 'path'
import { Request, Response } from 'express'
import { getPathPermission } from '../../file.utils'
import { UnauthorizedError } from '../../../../errors'
import { FileManagerDirectoryContent } from '../../file.utils'
import { StatusCodes } from 'http-status-codes'
import { AccessDetails } from '../../file.models'
import { CreateFolderReqBody } from './create-folder.models'

export async function createFolder(
  req: Request<{}, {}, CreateFolderReqBody>,
  res: Response,
  filepath: string,
  contentRootPath: string,
  accessDetails: AccessDetails | null
) {
  const newDirectoryPath = path.join(contentRootPath + req.body.path, req.body.name)
  const pathPermission = getPathPermission(
    req.path,
    false,
    req.body.data[0].name,
    filepath,
    contentRootPath,
    req.body.data[0].filterPath,
    accessDetails
  )
  if (pathPermission != null && (!pathPermission.read || !pathPermission.writeContents)) {
    throw new UnauthorizedError(
      req.body.data[0].name + ' is not accessible. You need permission to perform the writeContents action.'
    )
  } else {
    try {
      await fs.access(newDirectoryPath)
      return res.status(StatusCodes.OK).json({
        error: {
          code: StatusCodes.BAD_REQUEST.toString(),
          message: 'A file or folder with the name ' + req.body.name + ' already exists',
        },
      })
    } catch (error) {
      console.log(error)
      await fs.mkdir(newDirectoryPath)
      const data = await FileManagerDirectoryContent(req, res, newDirectoryPath, '', accessDetails)
      return res.status(StatusCodes.OK).json({ files: data })
    }
  }
}
