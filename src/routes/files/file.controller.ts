import fs from 'fs/promises'
import { getPermission } from './file.utils'
import yargs from 'yargs'
import { replaceRequestParams } from './file.utils'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

let contentRootPath = yargs.argv.d
contentRootPath = contentRootPath.replace('../', '')

export async function getImage(req: Request<{}, {}, {}, { path: string }>, res: Response) {
  replaceRequestParams(req, res)
  let image = req.query.path.split('/').length > 1 ? req.query.path : '/' + req.query.path
  let pathPermission = getPermission(
    contentRootPath + image.substr(0, image.lastIndexOf('/')),
    image.substr(image.lastIndexOf('/') + 1, image.length - 1),
    true,
    contentRootPath,
    image.substr(0, image.lastIndexOf('/'))
  )
  if (pathPermission != null && !pathPermission.read) {
    return null
  } else {
    const content = await fs.readFile(contentRootPath + image)
    res.status(StatusCodes.OK).contentType('image/jpg').send(content)
  }
}
