import path from 'path'
import fs from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import { getPermission } from './file.utils'
import { getPathPermission } from './file.utils'
import { FileManagerDirectoryContent } from './file.utils'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { UnauthorizedError } from '../../errors'
import { CONTENT_ROOT_PATH } from './file.constants'
import { AccessDetails, UploadFilesReqBody } from './file.models'
import { getRules } from './file-operations.utils'
import archiver from 'archiver'

export async function getImage(req: Request<{}, {}, {}, { path: string }>, res: Response) {
  let image = req.query.path.split('/').length > 1 ? req.query.path : '/' + req.query.path
  const accessDetails = await getRules()
  let pathPermission = getPermission(
    CONTENT_ROOT_PATH + image.substr(0, image.lastIndexOf('/')),
    image.substr(image.lastIndexOf('/') + 1, image.length - 1),
    true,
    CONTENT_ROOT_PATH,
    image.substr(0, image.lastIndexOf('/')),
    accessDetails!
  )
  if (pathPermission != null && !pathPermission.read) {
    return null
  } else {
    const content = await fs.readFile(CONTENT_ROOT_PATH + image)
    res.status(StatusCodes.OK).contentType('image/jpg').send(content)
  }
}

type UploadFile = {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  filename: string
  path: string
  size: number
}

export async function uploadFiles(req: Request<{}, {}, UploadFilesReqBody>, res: Response) {
  const accessDetails = await getRules()
  const { data, action, filename }: UploadFilesReqBody = req.body
  const pathPermission =
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
      pathPermission.message ||
        req.body.data.name + ' is not accessible. You need permission to perform the upload action.'
    )
  } else if (req.body != null && req.body.path != null) {
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
              await FileManagerDirectoryContent(req, res, newDirectoryPath, accessDetails!)
              // response = { files: data }
              // response = JSON.stringify(response)
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

export async function downloadFiles(req: Request, res: Response) {
  let downloadObj = JSON.parse(req.body.downloadInput)
  let permission
  let permissionDenied = false
  const accessDetails = await getRules()
  downloadObj.data.forEach((item) => {
    let filepath = (CONTENT_ROOT_PATH + item.filterPath).replace(/\\/g, '/')
    permission = getPermission(
      filepath + item.name,
      item.name,
      item.isFile,
      CONTENT_ROOT_PATH,
      item.filterPath,
      accessDetails!
    )
    if (permission != null && (!permission.read || !permission.download)) {
      permissionDenied = true
      throw new UnauthorizedError(
        permission ||
          path.join(item.filterPath, item.name) +
            ' is not accessible. You need permission to perform the download action.'
      )
    }
  })
  if (!permissionDenied) {
    if (downloadObj.names.length === 1 && downloadObj.data[0].isFile) {
      let file = CONTENT_ROOT_PATH + downloadObj.path + downloadObj.names[0]
      res.download(file)
    } else {
      let archive = archiver('zip', {
        gzip: true,
        zlib: { level: 9 }, // Sets the compression level.
      })
      let output = createWriteStream('./Files.zip')
      downloadObj.data.forEach((item) => {
        archive.on('error', (err) => {
          throw err
        })
        if (item.isFile) {
          archive.file(CONTENT_ROOT_PATH + item.filterPath + item.name, { name: item.name })
        } else {
          archive.directory(CONTENT_ROOT_PATH + item.filterPath + item.name + '/', item.name)
        }
      })
      archive.pipe(output)
      archive.finalize()
      output.on('close', async () => {
        let stat = await fs.stat(output.path)
        res.writeHead(StatusCodes.OK, {
          'Content-disposition': 'attachment; filename=Files.zip; filename*=UTF-8',
          'Content-Type': 'APPLICATION/octet-stream',
          'Content-Length': stat.size,
        })
        let filestream = createReadStream(output.path)
        return filestream.pipe(res)
      })
    }
  }
}
