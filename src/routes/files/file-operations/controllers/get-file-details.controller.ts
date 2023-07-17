import { fileDetails, getFolderSize, checkForMultipleLocations } from '../file-operations.utils'
import { getSize } from '../../file.utils'
import path from 'path'
import { StatusCodes } from 'http-status-codes'
import fs from 'fs/promises'

export function getFileDetails(req, res, contentRootPath, filterPath) {
  let isNamesAvailable = req.body.names.length > 0 ? true : false
  if (req.body.names.length == 0 && req.body.data != 0) {
    let nameValues: string[] = []
    req.body.data.forEach((item) => {
      nameValues.push(item.name)
    })
    req.body.names = nameValues
  }
  if (req.body.names.length == 1) {
    fileDetails(req, res, contentRootPath + (isNamesAvailable ? req.body.names[0] : '')).then(async (data) => {
      if (!data.isFile) {
        const size = await getFolderSize(req, res, contentRootPath + (isNamesAvailable ? req.body.names[0] : ''), 0)
        data.size = getSize(size)
      }
      if (filterPath == '') {
        data.location = path
          .join(filterPath, req.body.names[0])
          .substr(0, path.join(filterPath, req.body.names[0]).length)
      } else {
        data.location = path.join(req.body.path, filterPath, req.body.names[0])
      }
      return res.status(StatusCodes.OK).json({ details: data })
    })
  } else {
    let isMultipleLocations = false
    isMultipleLocations = checkForMultipleLocations(req, contentRootPath)
    let size
    req.body.names.forEach(async (item) => {
      if ((await fs.lstat(contentRootPath + item)).isDirectory()) {
        size = await getFolderSize(req, res, contentRootPath + item, 0)
      } else {
        const stats = await fs.stat(contentRootPath + item)
        size = stats.size
      }
    })
    fileDetails(req, res, contentRootPath + req.body.names[0]).then((data) => {
      const names: string[] = []
      req.body.names.forEach((name) => {
        if (name.split('/').length > 0) {
          names.push(name.split('/')[name.split('/').length - 1])
        } else {
          names.push(name)
        }
      })
      data.name = names.join(', ')
      data.multipleFiles = true
      data.size = getSize(size)
      size = 0
      if (filterPath == '') {
        data.location = path
          .join(path.join(contentRootPath, req.body.path), filterPath)
          .substr(0, path.join(path.join(contentRootPath, req.body.path), filterPath).length - 1)
      } else {
        data.location = path
          .join(path.join(contentRootPath, req.body.path), filterPath)
          .substr(0, path.join(path.join(contentRootPath, req.body.path), filterPath).length - 1)
      }
      isMultipleLocations = false
      return res.status(StatusCodes.OK).join({ details: data })
    })
  }
}
