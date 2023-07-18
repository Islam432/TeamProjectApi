import { getPathPermission, getPermission } from '../../file.utils'
import { UnauthorizedError, BadRequestError } from '../../../../errors'
import { checkForFileUpdate } from '../file-operations.utils'
import fs from 'fs/promises'
import path from 'path'
import { StatusCodes } from 'http-status-codes'


export function CopyFiles(req, res, contentRootPath, accessDetails) {
  let copyName = ''
  let fileList: string[] = []
  let replaceFileList: string[] = []
  let permission
  let permissionDenied = false
  const pathPermission = getPathPermission(
    req.path,
    false,
    req.body.targetData.name,
    contentRootPath + req.body.targetPath,
    contentRootPath,
    req.body.targetData.filterPath,
    accessDetails
  )
  req.body.data.forEach(function (item) {
    let fromPath = contentRootPath + item.filterPath
    permission = getPermission(fromPath, item.name, item.isFile, contentRootPath, item.filterPath, accessDetails)
    let fileAccessDenied = permission != null && (!permission.read || !permission.copy)
    let pathAccessDenied = pathPermission != null && (!pathPermission.read || !pathPermission.writeContents)
    if (fileAccessDenied || pathAccessDenied) {
      permissionDenied = true
      throw new UnauthorizedError(item.name + ' is not accessible. You need permission to perform the action')
    }
  })
  if (!permissionDenied) {
    req.body.data.forEach(async (item) => {
      let fromPath = contentRootPath + item.filterPath + item.name
      let toPath = contentRootPath + req.body.targetPath + item.name
      let isRenameChecking = checkForFileUpdate(fromPath, toPath, item, contentRootPath, req)
      if (!isRenameChecking) {
        toPath = contentRootPath + req.body.targetPath + copyName
        if (item.isFile) {
          await fs.copyFile(path.join(fromPath), path.join(toPath))
        } else {
          copyFolder(fromPath, toPath)
        }
        let list = item
        list.filterPath = req.body.targetPath
        list.name = copyName
        fileList.push(list)
      } else {
        replaceFileList.push(item.name)
      }
    })
    if (replaceFileList.length == 0) {
      return res.status(StatusCodes.OK).json({ files: fileList })
    } else {
      let isRenameChecking = false
      throw new BadRequestError('File Already Exists')
    }
  }
}

async function copyFolder(source, dest) {
  try {
    await fs.access(dest)
  } catch (error) {
    await fs.mkdir(dest)
  }

  let files = await fs.readdir(source)
  files.forEach(async (file) => {
    let curSource = path.join(source, file)
    curSource = curSource.replace('../', '')
    if ((await fs.lstat(curSource)).isDirectory()) {
      copyFolder(curSource, path.join(dest, file))
      source
    } else {
      await fs.copyFile(path.join(source, file), path.join(dest, file))
    }
  })
}
