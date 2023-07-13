import { getSize } from './file.utils'
import { CONTENT_ROOT_PATH } from './file.constants'
import { getPathPermission, getPermission } from './file.utils'
import path from 'path'
import { FileClass } from './file.models'
import fs from 'fs/promises'
import { AccessDetails, AccessRules } from './file.models'
import { pattern } from './file.constants'
import { StatusCodes } from 'http-status-codes'

export async function getRules() {
  let details = new AccessDetails('', null)
  let accessRuleFile = 'accessRules.json'
  try {
    await fs.access(accessRuleFile)
  } catch (error) {
    return null
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

export async function addSearchList(filename, CONTENT_ROOT_PATH, fileList, files, index) {
  let cwd = new FileClass()
  let stats = await fs.stat(filename)
  cwd.name = path.basename(filename)
  cwd.size = stats.size
  cwd.isFile = stats.isFile()
  cwd.dateModified = stats.mtime
  cwd.dateCreated = stats.ctime
  cwd.type = path.extname(filename)
  cwd.filterPath = filename.substr(CONTENT_ROOT_PATH.length, filename.length).replace(files[index], '')
  cwd.permission = getPermission(filename.replace(/\\/g, '/'), cwd.name, cwd.isFile, CONTENT_ROOT_PATH, cwd.filterPath)
  let permission = parentsHavePermission(filename, CONTENT_ROOT_PATH, cwd.isFile, cwd.name, cwd.filterPath)
  if (permission) {
    if ((await fs.lstat(filename)).isFile()) {
      cwd.hasChild = false
    }
    if ((await fs.lstat(filename)).isDirectory()) {
      let statsRead = await fs.readdir(filename)
      cwd.hasChild = statsRead.length > 0
    }
    fileList.push(cwd)
  }
}

export function parentsHavePermission(filepath, CONTENT_ROOT_PATH, isFile, name, filterPath) {
  let parentPath = filepath.substr(CONTENT_ROOT_PATH.length, filepath.length - 1).replace(/\\/g, '/')
  parentPath = parentPath.substr(0, parentPath.indexOf(name)) + (isFile ? '' : '/')
  let parents = parentPath.split('/')
  let currPath = '/'
  let hasPermission = true
  let pathPermission
  for (let i = 0; i <= parents.length - 2; i++) {
    currPath = parents[i] == '' ? currPath : currPath + parents[i] + '/'
    pathPermission = getPathPermission(
      parentPath,
      false,
      parents[i],
      CONTENT_ROOT_PATH + (currPath == '/' ? '' : '/'),
      CONTENT_ROOT_PATH,
      filterPath
    )
    if (pathPermission == null) {
      break
    } else if (pathPermission != null && !pathPermission.read) {
      hasPermission = false
      break
    }
  }
  return hasPermission
}

export function checkForSearchResult(casesensitive, filter, isFile, fileName, searchString) {
  let isAddable = false
  if (searchString.substr(0, 1) == '*' && searchString.substr(searchString.length - 1, 1) == '*') {
    if (
      casesensitive
        ? fileName.indexOf(filter) >= 0
        : fileName.indexOf(filter.toLowerCase()) >= 0 || fileName.indexOf(filter.toUpperCase()) >= 0
    ) {
      isAddable = true
    }
  } else if (searchString.substr(searchString.length - 1, 1) == '*') {
    if (
      casesensitive
        ? fileName.startsWith(filter)
        : fileName.startsWith(filter.toLowerCase()) || fileName.startsWith(filter.toUpperCase())
    ) {
      isAddable = true
    }
  } else {
    if (
      casesensitive
        ? fileName.endsWith(filter)
        : fileName.endsWith(filter.toLowerCase()) || fileName.endsWith(filter.toUpperCase())
    ) {
      isAddable = true
    }
  }
  return isAddable
}

export async function fromDir(startPath, filter, CONTENT_ROOT_PATH, casesensitive, searchString, fileList) {
  try {
    await fs.access(startPath)
  } catch (error) {
    return
  }

  let files = await fs.readdir(startPath)
  for (let i = 0; i < files.length; i++) {
    let filename = path.join(startPath, files[i])
    let stat = await fs.lstat(filename)
    if (stat.isDirectory()) {
      if (checkForSearchResult(casesensitive, filter, false, files[i], searchString)) {
        addSearchList(filename, CONTENT_ROOT_PATH, fileList, files, i)
      }
      fromDir(filename, filter, CONTENT_ROOT_PATH, casesensitive, searchString, fileList) //recurse
    } else if (checkForSearchResult(casesensitive, filter, true, files[i], searchString)) {
      addSearchList(filename, CONTENT_ROOT_PATH, fileList, files, i)
    }
  }
}

export async function ReadDirectories(file, req) {
  let cwd = new FileClass()
  let directoryList = []
  let promiseList: any[] = []
  for (let i = 0; i < file.length; i++) {
    promiseList.push(
      stats(
        path.join(CONTENT_ROOT_PATH + req.body.path.replace(pattern, ''), file[i]),
        req,
        directoryList,
        promiseList,
        i
      )
    )
  }
  return Promise.all(promiseList)
}

function stats(file, req, directoryList, promiseList, i) {
  return new Promise(async (resolve, reject) => {
    try {
      let cwd = new FileClass()
      let stat = await fs.stat(file)

      cwd.name = path.basename(CONTENT_ROOT_PATH + req.body.path + file)
      cwd.size = stat.size
      cwd.isFile = stat.isFile()
      cwd.dateModified = stat.ctime
      cwd.dateCreated = stat.mtime
      cwd.filterPath = getRelativePath(CONTENT_ROOT_PATH, CONTENT_ROOT_PATH + req.body.path)
      cwd.type = path.extname(CONTENT_ROOT_PATH + req.body.path + file)
      cwd.permission = getPermission(
        CONTENT_ROOT_PATH + req.body.path + cwd.name,
        cwd.name,
        cwd.isFile,
        CONTENT_ROOT_PATH,
        cwd.filterPath
      )
      if ((await fs.lstat(file)).isDirectory()) {
        const files = await fs.readdir(file)

        files.forEach(async function (items) {
          if ((await fs.stat(path.join(file, items))).isDirectory()) {
            directoryList.push(items[i])
          }
          if (directoryList.length > 0) {
            cwd.hasChild = true
          } else {
            cwd.hasChild = false
            directoryList = []
          }
        })
      } else {
        cwd.hasChild = false
      }
      directoryList = []
      resolve(cwd)
    } catch (error) {
      reject(error)
    }
  })
}

function getRelativePath(rootDirectory, fullPath) {
  if (rootDirectory.substring(rootDirectory.length - 1) == '/') {
    if (fullPath.indexOf(rootDirectory) >= 0) {
      return fullPath.substring(rootDirectory.length - 1)
    }
  } else if (fullPath.indexOf(rootDirectory + '/') >= 0) {
    return '/' + fullPath.substring(rootDirectory.length + 1)
  } else {
    return ''
  }
}

export function GetFiles(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      const files = await fs.readdir(CONTENT_ROOT_PATH + req.body.path.replace(pattern, ''))
      resolve(files)
    } catch (error) {
      reject(error)
    }
  })
}

function fileDetails(req, res, filepath) {
  return new Promise<FileClass>(async (resolve, reject) => {
    let cwd = new FileClass()
    const stats = await fs.stat(filepath)
    cwd.name = path.basename(filepath)
    cwd.size = getSize(stats.size)
    cwd.isFile = stats.isFile()
    cwd.dateModified = stats.ctime
    cwd.dateCreated = stats.mtime
    cwd.type = path.extname(filepath)
    cwd.location = req.body.data[0].filterPath
    resolve(cwd)
  })
}

async function getFolderSize(req, res, directory, sizeValue) {
  let size = sizeValue
  let filenames = await fs.readdir(directory)
  for (let i = 0; i < filenames.length; i++) {
    if ((await fs.lstat(directory + '/' + filenames[i])).isDirectory()) {
      await getFolderSize(req, res, directory + '/' + filenames[i], size)
    } else {
      const stats = await fs.stat(directory + '/' + filenames[i])
      size = size + stats.size
    }
  }
  return size
}

function getFileDetails(req, res, contentRootPath, filterPath) {
  let isNamesAvailable = req.body.names.length > 0 ? true : false
  if (req.body.names.length == 0 && req.body.data != 0) {
    let nameValues: string[] = []
    req.body.data.forEach(function (item) {
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
      return res.status(StatusCodes.OK).contentType('application/json').json({ details: data })
    })
  } else {
    let isMultipleLocations = false
    isMultipleLocations = checkForMultipleLocations(req, contentRootPath)
    let size
    req.body.names.forEach(async function (item) {
      if ((await fs.lstat(contentRootPath + item)).isDirectory()) {
        size = await getFolderSize(req, res, contentRootPath + item, 0)
      } else {
        const stats = await fs.stat(contentRootPath + item)
        size = stats.size
      }
    })
    fileDetails(req, res, contentRootPath + req.body.names[0]).then((data) => {
      const names: string[] = []
      req.body.names.forEach(function (name) {
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
        data.location = path.join(rootName, filterPath).substr(0, path.join(rootName, filterPath).length - 1)
      } else {
        data.location = path.join(rootName, filterPath).substr(0, path.join(rootName, filterPath).length - 1)
      }
      response = { details: data }
      response = JSON.stringify(response)
      res.setHeader('Content-Type', 'application/json')
      isMultipleLocations = false
      location = ''
      res.json(response)
    })
  }
}

function checkForMultipleLocations(req, contentRootPath) {
  var previousLocation = ''
  var isMultipleLocation = false
  req.body.data.forEach(function (item) {
    if (previousLocation == '') {
      previousLocation = item.filterPath
      location = item.filterPath
    } else if (previousLocation == item.filterPath && !isMultipleLocation) {
      isMultipleLocation = false
      location = item.filterPath
    } else {
      isMultipleLocation = true
      location = 'Various Location'
    }
  })
  if (!isMultipleLocation) {
    location =
      contentRootPath.split('/')[contentRootPath.split('/').length - 1] + location.substr(0, location.length - 2)
  }
  return isMultipleLocation
}
