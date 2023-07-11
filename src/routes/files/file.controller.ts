import path from 'path'
import fs from 'fs/promises'
import { getPermission } from './file.utils'
import { getPathPermission } from './file.utils'
import { replaceRequestParams } from './file.utils'
import { FileManagerDirectoryContent } from './file.utils'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { UnauthorizedError } from '../../errors'
import { CONTENT_ROOT_PATH } from './file.utils'
import { fileName } from './file.utils'

export async function getImage(req: Request<{}, {}, {}, { path: string }>, res: Response) {
  replaceRequestParams(req, res)
  let image = req.query.path.split('/').length > 1 ? req.query.path : '/' + req.query.path
  let pathPermission = getPermission(
    CONTENT_ROOT_PATH + image.substr(0, image.lastIndexOf('/')),
    image.substr(image.lastIndexOf('/') + 1, image.length - 1),
    true,
    CONTENT_ROOT_PATH,
    image.substr(0, image.lastIndexOf('/'))
  )
  if (pathPermission != null && !pathPermission.read) {
    return null
  } else {
    const content = await fs.readFile(CONTENT_ROOT_PATH + image)
    res.status(StatusCodes.OK).contentType('image/jpg').send(content)
  }
}

type UploadFilesReqBody = {
  data: { name: string; filterPath: string }
  path: string
  action: string
  filename: string
}

export async function uploadFiles(req: Request<{}, {}, UploadFilesReqBody>, res: Response) {
  replaceRequestParams(req, res)
  const { data, action, filename }: UploadFilesReqBody = req.body
  let pathPermission =
    data != null
      ? getPathPermission(
          req.path,
          true,
          data.name,
          CONTENT_ROOT_PATH + req.body.path,
          CONTENT_ROOT_PATH,
          data.filterPath
        )
      : null
  if (pathPermission != null && (!pathPermission.read || !pathPermission.upload)) {
    throw new UnauthorizedError(
      req.body.data.name + ' is not accessible. You need permission to perform the upload action.'
    )
  } else if (req.body != null && req.body.path != null) {
    let errorValue = new Error()
    if (action === 'save') {
      let folders = filename.split('/')
      let filepath = req.body.path
      let uploadedFileName = folders[folders.length - 1]
      // checking the folder upload
      if (folders.length > 1) {
        for (let i = 0; i < folders.length - 1; i++) {
          let newDirectoryPath = path.join(CONTENT_ROOT_PATH + filepath, folders[i])
          try {
            await fs.access(newDirectoryPath)
          } catch (error) {
            fs.mkdir(newDirectoryPath)
            ;(async () => {
              const data = await FileManagerDirectoryContent(req, res, newDirectoryPath)
              // response = { files: data }
              // response = JSON.stringify(response)
            })()
          }
          filepath += folders[i] + '/'
        }
        await fs.rename('./' + uploadedFileName, path.join(CONTENT_ROOT_PATH, filepath + uploadedFileName))
      } else {
        for (let i = 0; i < fileName.length; i++) {
          ;(async () => {
            await fs.rename('./' + fileName[i], path.join(CONTENT_ROOT_PATH, filepath + fileName[i]))
          })()
        }
      }
    } else if (req.body.action === 'remove') {
      await fs.access(path.join(CONTENT_ROOT_PATH, req.body.path + req.body['cancel-uploading']))
      await fs.unlink(path.join(CONTENT_ROOT_PATH, req.body.path + req.body['cancel-uploading']))
    }

    res.status(StatusCodes.OK).json({ message: 'Successfully uploaded the file' })
  }
}
