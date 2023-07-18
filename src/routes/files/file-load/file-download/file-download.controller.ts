import fs from 'fs/promises'
import path from 'path'
import archiver from 'archiver'
import { Request, Response } from 'express'
import { getRules } from '../../file.utils'
import { CONTENT_ROOT_PATH } from '../../file.constants'
import { getPermission } from '../../file.utils'
import { UnauthorizedError } from '../../../../errors'
import { createWriteStream, createReadStream } from 'fs'
import { StatusCodes } from 'http-status-codes'
import { DownloadObj, FileDownloadReqBody } from './file-download.models'

export async function downloadFiles(req: Request<{}, {}, FileDownloadReqBody>, res: Response) {
  const downloadObj: DownloadObj = JSON.parse(req.body.downloadInput)
  console.log(downloadObj)
  const accessDetails = await getRules(req, res)

  for (const item of downloadObj.data) {
    const filepath = (CONTENT_ROOT_PATH + item.filterPath).replace(/\\/g, '/')
    const permission = getPermission(
      filepath + item.name,
      item.name,
      item.isFile,
      CONTENT_ROOT_PATH,
      item.filterPath,
      accessDetails!
    )
    if (permission != null && (!permission.read || !permission.download)) {
      return res.status(StatusCodes.OK).json({
        error: {
          code: StatusCodes.UNAUTHORIZED.toString(),
          message:
            permission.message ||
            path.join(item.filterPath, item.name) +
              ' is not accessible. You need permission to perform the download action.',
        },
      })
    }
  }

  if (downloadObj.names.length === 1 && downloadObj.data[0].isFile) {
    const file = CONTENT_ROOT_PATH + downloadObj.path + downloadObj.names[0]
    res.download(file)
  } else {
    const archive = archiver('zip', {
      gzip: true,
      zlib: { level: 9 }, // Sets the compression level.
    })
    const output = createWriteStream('./Files.zip')

    for (const item of downloadObj.data) {
      archive.on('error', (err) => {
        throw err
      })
      if (item.isFile) {
        archive.file(CONTENT_ROOT_PATH + item.filterPath + item.name, { name: item.name })
      } else {
        archive.directory(CONTENT_ROOT_PATH + item.filterPath + item.name + '/', item.name)
      }
    }
    archive.pipe(output)
    archive.finalize()
    output.on('close', async () => {
      const stat = await fs.stat(output.path)
      res.writeHead(StatusCodes.OK, {
        'Content-disposition': 'attachment; filename=Files.zip; filename*=UTF-8',
        'Content-Type': 'APPLICATION/octet-stream',
        'Content-Length': stat.size,
      })
      const filestream = createReadStream(output.path)
      return filestream.pipe(res)
    })
  }
}
