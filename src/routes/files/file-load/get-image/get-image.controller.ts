import { Request, Response } from 'express'
import { getPermission, getRules } from '../../file.utils'
import { CONTENT_ROOT_PATH } from '../../file.constants'
import fs from 'fs/promises'
import { StatusCodes } from 'http-status-codes'
import { JPEG } from '../../../../shared/content-type.constants'
import { GetImageReqQuery } from './get-image.models'

export async function getImage(req: Request<{}, {}, {}, GetImageReqQuery>, res: Response) {
  const image = req.query.path.split('/').length > 1 ? req.query.path : '/' + req.query.path
  const accessDetails = await getRules(req, res)
  const pathPermission = getPermission(
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
    return res.status(StatusCodes.OK).contentType(JPEG).send(content)
  }
}
