import { CONTENT_ROOT_PATH } from './file.constants'
import fs from 'fs/promises'
import { AccessRules, FileClass, Permission } from './file.models'
import { AccessPermission } from './file.models'
import { AccessDetails } from './file.models'
import { Request, Response } from 'express'
import { replaceRequestParams } from './middleware/replace-req-params.middleware'
import path from 'path'
import multer from 'multer'

export const multerConfig = {
  storage: multer.diskStorage({
    destination: function (req, file, next) {
      next(null, CONTENT_ROOT_PATH)
    },
    filename: function (req, file, next) {
      next(null, file.originalname)
    },
  }),
  fileFilter: function (req, file, next) {
    next(null, true)
  },
}

export function getSize(size: number) {
  let hz: string
  if (size < 1024) hz = size + ' B'
  else if (size < 1024 * 1024) hz = (size / 1024).toFixed(2) + ' KB'
  else if (size < 1024 * 1024 * 1024) hz = (size / 1024 / 1024).toFixed(2) + ' MB'
  else hz = (size / 1024 / 1024 / 1024).toFixed(2) + ' GB'
  return hz
}

function hasPermission(rule) {
  return rule == undefined || rule == null || rule == Permission.Allow ? true : false
}

function getMessage(rule: AccessRules) {
  return rule.message == undefined || rule.message == null ? '' : rule.message
}

function updateRules(filePermission: AccessPermission, accessRule: AccessRules) {
  filePermission.download = hasPermission(accessRule.read) && hasPermission(accessRule.download)
  filePermission.write = hasPermission(accessRule.read) && hasPermission(accessRule.write)
  filePermission.writeContents = hasPermission(accessRule.read) && hasPermission(accessRule.writeContents)
  filePermission.copy = hasPermission(accessRule.read) && hasPermission(accessRule.copy)
  filePermission.read = hasPermission(accessRule.read)
  filePermission.upload = hasPermission(accessRule.read) && hasPermission(accessRule.upload)
  filePermission.message = getMessage(accessRule)
  return filePermission
}

export function getPermission(
  filepath: string,
  name: string,
  isFile: boolean,
  contentRootPath: string,
  filterPath: string,
  accessDetails: AccessDetails
) {
  let filePermission = new AccessPermission(true, true, true, true, true, true, '')
  if (accessDetails == null) {
    return null
  } else {
    accessDetails.rules?.forEach(function (accessRule) {
      if (isFile && accessRule.isFile) {
        let nameExtension = name.substr(name.lastIndexOf('.'), name.length - 1).toLowerCase()
        let fileName = name.substr(0, name.lastIndexOf('.'))
        let currentPath = contentRootPath + filterPath
        if (
          accessRule.isFile &&
          isFile &&
          accessRule.path != '' &&
          accessRule.path != null &&
          (accessRule.role == null || accessRule.role == accessDetails?.role)
        ) {
          if (accessRule.path.indexOf('*.*') > -1) {
            let parentPath = accessRule.path.substr(0, accessRule.path.indexOf('*.*'))
            if (currentPath.indexOf(contentRootPath + parentPath) == 0 || parentPath == '') {
              filePermission = updateRules(filePermission, accessRule)
            }
          } else if (accessRule.path.indexOf('*.') > -1) {
            let pathExtension = accessRule.path
              .substr(accessRule.path.lastIndexOf('.'), accessRule.path.length - 1)
              .toLowerCase()
            let parentPath = accessRule.path.substr(0, accessRule.path.indexOf('*.'))
            if ((contentRootPath + parentPath == currentPath || parentPath == '') && nameExtension == pathExtension) {
              filePermission = updateRules(filePermission, accessRule)
            }
          } else if (accessRule.path.indexOf('.*') > -1) {
            let pathName = accessRule.path
              .substr(0, accessRule.path.lastIndexOf('.'))
              .substr(accessRule.path.lastIndexOf('/') + 1, accessRule.path.length - 1)
            let parentPath = accessRule.path.substr(0, accessRule.path.indexOf(pathName + '.*'))
            if ((contentRootPath + parentPath == currentPath || parentPath == '') && fileName == pathName) {
              filePermission = updateRules(filePermission, accessRule)
            }
          } else if (contentRootPath + accessRule.path == filepath) {
            filePermission = updateRules(filePermission, accessRule)
          }
        }
      } else {
        if (
          !accessRule.isFile &&
          !isFile &&
          accessRule.path != null &&
          (accessRule.role == null || accessRule.role == accessDetails?.role)
        ) {
          let parentFolderpath = contentRootPath + filterPath
          if (accessRule.path.indexOf('*') > -1) {
            let parentPath = accessRule.path.substr(0, accessRule.path.indexOf('*'))
            if (
              (parentFolderpath + (parentFolderpath[parentFolderpath.length - 1] == '/' ? '' : '/') + name).lastIndexOf(
                contentRootPath + parentPath
              ) == 0 ||
              parentPath == ''
            ) {
              filePermission = updateRules(filePermission, accessRule)
            }
          } else if (
            path.join(contentRootPath, accessRule.path) == path.join(parentFolderpath, name) ||
            path.join(contentRootPath, accessRule.path) == path.join(parentFolderpath, name + '/')
          ) {
            filePermission = updateRules(filePermission, accessRule)
          } else if (path.join(parentFolderpath, name).lastIndexOf(path.join(contentRootPath, accessRule.path)) == 0) {
            filePermission.write = hasPermission(accessRule.writeContents)
            filePermission.writeContents = hasPermission(accessRule.writeContents)
            filePermission.message = getMessage(accessRule)
          }
        }
      }
    })
    return filePermission
  }
}

export function getPathPermission(
  path: string,
  isFile: boolean,
  name: string,
  filepath: string,
  contentRootPath: string,
  filterPath: string,
  accessDetails?: AccessDetails
) {
  return getPermission(filepath, name, isFile, contentRootPath, filterPath, accessDetails!)
}

export function FileManagerDirectoryContent(
  req: Request,
  res: Response,
  filepath: string,
  accessDetails?: AccessDetails,
  searchFilterPath?: string
) {
  return new Promise<FileClass>(async (resolve, reject) => {
    replaceRequestParams(req, res)
    let cwd = new FileClass()
    fs.stat(filepath).then(async (stats) => {
      cwd = new FileClass(
        path.basename(filepath),
        getSize(stats.size),
        stats.isFile(),
        stats.mtime,
        stats.ctime,
        path.extname(filepath)
      )
      if (searchFilterPath) {
        cwd.filterPath = searchFilterPath
      } else {
        cwd.filterPath = req.body.data.length > 0 ? req.body.path : ''
      }
      cwd.permission = getPathPermission(
        req.path,
        cwd.isFile,
        req.body.path == '/' ? '' : cwd.name,
        filepath,
        CONTENT_ROOT_PATH,
        cwd.filterPath,
        accessDetails
      )!
      if ((await fs.lstat(filepath)).isDirectory()) {
        cwd.hasChild = false
        resolve(cwd)
      }
    })

    if ((await fs.lstat(filepath)).isDirectory()) {
      const contents = await fs.readdir(filepath)
      for (const content of contents) {
        if ((await fs.lstat(filepath + content)).isDirectory()) {
          cwd.hasChild = true
        } else {
          cwd.hasChild = false
        }
        if (cwd.hasChild) return
      }
      resolve(cwd)
    }
  })
}

export async function getRules(req, res) {
  if (res.locals.user.role_name === 'admin') return
  let details = new AccessDetails('', null)
  let accessRuleFile = 'accessRules.json'
  try {
    await fs.access(accessRuleFile)
  } catch (error) {
    return
  }
  let rules = await import('../../../accessRules.json')
  let data = rules.rules
  let accessRules: AccessRules[] = []
  for (let i = 0; i < data.length; i++) {
    let rule = new AccessRules(
      data[i].path,
      data[i].role,
      data[i].read,
      data[i].write,
      data[i].writeContents,
      data[i].copy,
      data[i].download,
      data[i].upload,
      data[i].isFile,
      data[i].message
    )
    accessRules.push(rule)
  }
  if (accessRules.length == 1 && accessRules[0].path == undefined) {
    return null
  } else {
    details.rules = accessRules
    details.role = rules.role
    return details
  }
}
