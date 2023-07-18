import fs from 'fs/promises'
import path from 'path'
import { fileDetails, getFolderSize, checkForMultipleLocations } from '../file-operations.utils'
import { getSize } from '../../file.utils'
import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { CONTENT_ROOT_PATH } from '../../file.constants'
import { GetFileDetailsReqBody } from './get-file-details.models'

export async function getFileDetails(
  req: Request<{}, {}, GetFileDetailsReqBody>,
  res: Response,
  contentRootPath: string,
  filterPath: string
) {
  const isNamesAvailable = req.body.names.length > 0 ? true : false
  const rootName = path.basename(CONTENT_ROOT_PATH)
  if (req.body.names.length == 0 && req.body.data.length !== 0) {
    const nameValues: string[] = []
    for (const item of req.body.data) {
      nameValues.push(item.name)
    }
    req.body.names = nameValues
  }
  if (req.body.names.length == 1) {
    const data = await fileDetails(req, res, contentRootPath + (isNamesAvailable ? req.body.names[0] : ''))
    if (!data.isFile) {
      const size = await getFolderSize(req, res, contentRootPath + (isNamesAvailable ? req.body.names[0] : ''))
      data.size = getSize(size)
    }
    if (filterPath == '') {
      data.location = path
        .join(filterPath, req.body.names[0])
        .substr(0, path.join(filterPath, req.body.names[0]).length)
    } else {
      data.location = path.join(rootName, filterPath, req.body.names[0])
    }
    return res.status(StatusCodes.OK).json({ details: data })
  } else {
    let isMultipleLocations = false
    isMultipleLocations = checkForMultipleLocations(req, contentRootPath)
    console.log(isMultipleLocations)
    let size = 0
    for (const item of req.body.names) {
      if ((await fs.lstat(contentRootPath + item)).isDirectory()) {
        size += await getFolderSize(req, res, contentRootPath + item)
      } else {
        const stats = await fs.stat(contentRootPath + item)
        size += stats.size
      }
    }

    const data = await fileDetails(req, res, contentRootPath + req.body.names[0])
    const names: string[] = []
    for (const name of req.body.names) {
      if (name.split('/').length > 0) {
        names.push(name.split('/')[name.split('/').length - 1])
      } else {
        names.push(name)
      }
    }
    data.name = names.join(', ')
    data.multipleFiles = true
    data.size = getSize(size)
    size = 0
    if (filterPath == '') {
      data.location = path.join(rootName, req.body.path, filterPath).slice(0, -1)
    } else {
      data.location = path.join(rootName, req.body.path, filterPath).slice(0, -1)
    }
    isMultipleLocations = false
    return res.status(StatusCodes.OK).json({ details: data })
  }
}
