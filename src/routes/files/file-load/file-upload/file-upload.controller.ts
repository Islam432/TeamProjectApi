import { Request, Response } from 'express'
import { getRules, getPathPermission, FileManagerDirectoryContent } from '../../file.utils'
import { CONTENT_ROOT_PATH } from '../../file.constants'
import { UnauthorizedError } from '../../../../errors'
import path from 'path'
import fs from 'fs/promises'
import { StatusCodes } from 'http-status-codes'
import { FileDetails } from '../../file.models'
import { FileUploadReqBody } from './file-upload.modelts'

export async function uploadFiles(req: Request<{}, {}, FileUploadReqBody>, res: Response) {
  const accessDetails = await getRules(req, res)
  const uploadObj: FileDetails = JSON.parse(req.body.data)
  const pathPermission =
    uploadObj != null
      ? getPathPermission(
          req.path,
          true,
          uploadObj.name,
          CONTENT_ROOT_PATH + req.body.path,
          CONTENT_ROOT_PATH,
          uploadObj.filterPath
        )
      : null
  if (pathPermission != null && (!pathPermission.read || !pathPermission.upload)) {
    return res.status(StatusCodes.OK).json({
      error: {
        code: StatusCodes.UNAUTHORIZED.toString(),
        message:
          pathPermission.message ||
          uploadObj.name + ' is not accessible. You need permission to perform the upload action.',
      },
    })
  } else if (req.body != null && req.body.path != null) {
    if (req.body.action === 'save') {
      const folders = req.body.filename.split('/')
      const uploadedFileName = folders[folders.length - 1]
      let filepath = req.body.path
      // checking the folder upload
      if (folders.length > 1) {
        for (let i = 0; i < folders.length - 1; i++) {
          let newDirectoryPath = path.join(CONTENT_ROOT_PATH + filepath, folders[i])
          try {
            await fs.access(newDirectoryPath)
          } catch (error) {
            fs.mkdir(newDirectoryPath)
            ;(async () => {
              await FileManagerDirectoryContent(req, res, newDirectoryPath, '', accessDetails!)
            })()
          }
          filepath += folders[i] + '/'
        }
        await fs.rename(
          path.join(CONTENT_ROOT_PATH, uploadedFileName),
          path.join(CONTENT_ROOT_PATH, filepath + uploadedFileName)
        )
      } else {
        await fs.rename(
          path.join(CONTENT_ROOT_PATH, req.body.filename),
          path.join(CONTENT_ROOT_PATH, filepath + req.body.filename)
        )
      }
    } else if (req.body.action === 'remove') {
      await fs.access(path.join(CONTENT_ROOT_PATH, req.body.path + req.body['cancel-uploading']))
      await fs.unlink(path.join(CONTENT_ROOT_PATH, req.body.path + req.body['cancel-uploading']))
    }
    return res.status(StatusCodes.OK).json({ message: 'Successfully uploaded the file' })
  }
}
