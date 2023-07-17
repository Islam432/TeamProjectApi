import { getPathPermission, getPermission, getSize, FileManagerDirectoryContent } from '../file.utils'
import path from 'path'
import fs from 'fs/promises'
import { createReadStream, createWriteStream } from 'fs'
import { AccessDetails, AccessRules, FileClass } from '../file.models'
import { pattern, CONTENT_ROOT_PATH } from '../file.constants'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, UnauthorizedError } from '../../../errors'
import { Request, Response } from 'express'

export async function addSearchList(filename, CONTENT_ROOT_PATH, fileList, files, index, accessDetails) {
  let cwd = new FileClass()
  let stats = await fs.stat(filename)
  cwd.name = path.basename(filename)
  cwd.size = stats.size
  cwd.isFile = stats.isFile()
  cwd.dateModified = stats.mtime
  cwd.dateCreated = stats.ctime
  cwd.type = path.extname(filename)
  cwd.filterPath = filename.substr(CONTENT_ROOT_PATH.length, filename.length).replace(files[index], '')
  cwd.permission = getPermission(
    filename.replace(/\\/g, '/'),
    cwd.name,
    cwd.isFile,
    CONTENT_ROOT_PATH,
    cwd.filterPath,
    accessDetails
  )
  let permission = parentsHavePermission(
    filename,
    CONTENT_ROOT_PATH,
    cwd.isFile,
    cwd.name,
    cwd.filterPath,
    accessDetails
  )
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

export function parentsHavePermission(filepath, CONTENT_ROOT_PATH, isFile, name, filterPath, accessDetails) {
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
      filterPath,
      accessDetails
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

export async function fromDir(
  startPath,
  filter,
  CONTENT_ROOT_PATH,
  casesensitive,
  searchString,
  fileList,
  accessDetails
) {
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
        addSearchList(filename, CONTENT_ROOT_PATH, fileList, files, i, accessDetails)
      }
      fromDir(filename, filter, CONTENT_ROOT_PATH, casesensitive, searchString, fileList, accessDetails) //recurse
    } else if (checkForSearchResult(casesensitive, filter, true, files[i], searchString)) {
      addSearchList(filename, CONTENT_ROOT_PATH, fileList, files, i, accessDetails)
    }
  }
}

export async function ReadDirectories(file, req, accessDetails) {
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
        i,
        accessDetails
      )
    )
  }
  return Promise.all(promiseList)
}

function stats(file, req, directoryList, promiseList, i, accessDetails) {
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
        cwd.filterPath,
        accessDetails
      )
      if ((await fs.lstat(file)).isDirectory()) {
        const files = await fs.readdir(file)

        files.forEach(async (items) => {
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

export function GetFiles(req: Request, res: Response) {
  return fs.readdir(CONTENT_ROOT_PATH + req.body.path)
}

export function fileDetails(req, res, filepath) {
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

export async function getFolderSize(req, res, directory, sizeValue) {
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

export function checkForMultipleLocations(req, contentRootPath) {
  let previousLocation = ''
  let isMultipleLocation = false
  let location = ''
  req.body.data.forEach((item) => {
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

export function CopyFiles(req, res, contentRootPath, accessDetails) {
  let copyName = ''
  let fileList: string[] = []
  let replaceFileList: string[] = []
  let permission
  let pathPermission
  let permissionDenied = false
  pathPermission = getPathPermission(
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

async function checkForFileUpdate(fromPath, toPath, item, contentRootPath, req) {
  let count = 1
  let copyName = ''
  let isRenameChecking = false
  let name = (copyName = item.name)
  if (fromPath == toPath) {
    if (await checkForDuplicates(contentRootPath + req.body.targetPath, name, item.isFile)) {
      updateCopyName(contentRootPath + req.body.targetPath, name, count, item.isFile)
    }
  } else {
    if (req.body.renameFiles.length > 0 && req.body.renameFiles.indexOf(item.name) >= 0) {
      updateCopyName(contentRootPath + req.body.targetPath, name, count, item.isFile)
    } else {
      if (await checkForDuplicates(contentRootPath + req.body.targetPath, name, item.isFile)) {
        isRenameChecking = true
      }
    }
  }
  return isRenameChecking
}

async function checkForDuplicates(directory, name, isFile) {
  let filenames = await fs.readdir(directory)

  if (filenames.indexOf(name) == -1) {
    return false
  } else {
    for (let i = 0; i < filenames.length; i++) {
      if (filenames[i] === name) {
        if (!isFile && (await fs.lstat(directory + '/' + filenames[i])).isDirectory()) {
          return true
        } else if (isFile && !(await fs.lstat(directory + '/' + filenames[i])).isDirectory()) {
          return true
        } else {
          return false
        }
      }
    }
  }
}

async function updateCopyName(path, name, count, isFile) {
  let copyName = ''
  let subName = '',
    extension = ''
  if (isFile) {
    extension = name.substr(name.lastIndexOf('.'), name.length - 1)
    subName = name.substr(0, name.lastIndexOf('.'))
  }
  copyName = !isFile ? name + '(' + count + ')' : subName + '(' + count + ')' + extension
  if (await checkForDuplicates(path, copyName, isFile)) {
    count = count + 1
    updateCopyName(path, name, count, isFile)
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

async function MoveFolder(source, dest) {
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
      MoveFolder(curSource, path.join(dest, file))
      await fs.rmdir(curSource)
    } else {
      await fs.copyFile(path.join(source, file), path.join(dest, file))
      await fs.unlink(path.join(source, file))
    }
  })
}

export function MoveFiles(req, res, contentRootPath, accessDetails) {
  let fileList: string[] = []
  let replaceFileList: string[] = []
  let permission
  let pathPermission
  let permissionDenied = false
  pathPermission = getPathPermission(
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
    let fileAccessDenied = permission != null && (!permission.read || !permission.write)
    let pathAccessDenied = pathPermission != null && (!pathPermission.read || !pathPermission.writeContents)
    if (fileAccessDenied || pathAccessDenied) {
      permissionDenied = true
      throw new UnauthorizedError(item.name + ' is not accessible. You need permission to perform the write action.')
    }
  })
  let isRenameChecking = false
  if (!permissionDenied) {
    req.body.data.forEach(async (item) => {
      let fromPath = contentRootPath + item.filterPath + item.name
      let toPath = contentRootPath + req.body.targetPath + item.name
      checkForFileUpdate(fromPath, toPath, item, contentRootPath, req)
      if (!isRenameChecking) {
        toPath = contentRootPath + req.body.targetPath + item.name
        if (item.isFile) {
          let source = createReadStream(path.join(fromPath))
          let desti = createWriteStream(path.join(toPath))
          source.pipe(desti)
          source.on('end', async () => {
            await fs.unlink(path.join(fromPath))
          })
        } else {
          MoveFolder(fromPath, toPath)
          await fs.rmdir(fromPath)
        }
        let list = item
        list.name = item.name
        list.filterPath = req.body.targetPath
        fileList.push(list)
      } else {
        replaceFileList.push(item.name)
      }
    })
    if (replaceFileList.length == 0) {
      return res.status(StatusCodes.OK).json({ files: fileList })
    } else {
      isRenameChecking = false
      throw new BadRequestError('File Already Exists.')
    }
  }
}

export async function createFolder(req, res, filepath, contentRootPath, accessDetails) {
  let newDirectoryPath = path.join(contentRootPath + req.body.path, req.body.name)
  let pathPermission = getPathPermission(
    req.path,
    false,
    req.body.data[0].name,
    filepath,
    contentRootPath,
    req.body.data[0].filterPath,
    accessDetails
  )
  if (pathPermission != null && (!pathPermission.read || !pathPermission.writeContents)) {
    throw new UnauthorizedError(
      req.body.data[0].name + ' is not accessible. You need permission to perform the writeContents action.'
    )
  } else {
    try {
      await fs.access(newDirectoryPath)
      throw new BadRequestError('A file or folder with the name ' + req.body.name + ' already exists')
    } catch (error) {
      await fs.mkdir(newDirectoryPath)
      ;(async () => {
        await FileManagerDirectoryContent(req, res, newDirectoryPath, accessDetails).then((data) => {
          return res.status(StatusCodes.OK).json({ files: data })
        })
      })()
    }
  }
}

async function deleteFolderRecursive(path) {
  try {
    await fs.access(path)
    const files = await fs.readFile(path)
    files.forEach(async (file, index) => {
      let curPath = path + '/' + file
      curPath = curPath.replace('../', '')
      if ((await fs.lstat(curPath)).isDirectory()) {
        await deleteFolderRecursive(curPath)
      } else {
        await fs.unlink(curPath)
      }
    })
    await fs.rmdir(path)
  } catch (error) {
    throw error
  }
}

export async function deleteFolder(req, res, contentRootPath, accessDetails) {
  let permission
  let permissionDenied = false
  req.body.data.forEach(function (item) {
    let fromPath = contentRootPath + item.filterPath
    permission = getPermission(fromPath, item.name, item.isFile, contentRootPath, item.filterPath, accessDetails)
    if (permission != null && (!permission.read || !permission.write)) {
      permissionDenied = true
      throw new UnauthorizedError(item.name + ' is not accessible. You need permission to perform the write action')
    }
  })
  if (!permissionDenied) {
    let promiseList: Promise<FileClass>[] = []
    for (let i = 0; i < req.body.data.length; i++) {
      let newDirectoryPath = path.join(contentRootPath + req.body.data[i].filterPath, req.body.data[i].name)
      if ((await fs.lstat(newDirectoryPath)).isFile()) {
        promiseList.push(FileManagerDirectoryContent(req, res, newDirectoryPath, req.body.data[i].filterPath))
      } else {
        promiseList.push(FileManagerDirectoryContent(req, res, newDirectoryPath + '/', req.body.data[i].filterPath))
      }
    }
    Promise.all(promiseList).then((data) => {
      data.forEach(async (files) => {
        if ((await fs.lstat(path.join(contentRootPath + files.filterPath, files.name))).isFile()) {
          await fs.unlink(path.join(contentRootPath + files.filterPath, files.name))
        } else {
          await deleteFolderRecursive(path.join(contentRootPath + files.filterPath, files.name))
        }
      })
      return res.status(StatusCodes.OK).json({ files: data })
    })
  }
}

export async function renameFolder(req, res, contentRootPath, accessDetails) {
  var oldName = req.body.data[0].name.split('/')[req.body.data[0].name.split('/').length - 1]
  var newName = req.body.newName.split('/')[req.body.newName.split('/').length - 1]
  var permission = getPermission(
    contentRootPath + req.body.data[0].filterPath,
    oldName,
    req.body.data[0].isFile,
    contentRootPath,
    req.body.data[0].filterPath,
    accessDetails
  )
  if (permission != null && (!permission.read || !permission.write)) {
    throw new UnauthorizedError(
      oldName + ' is not accessible.  is not accessible. You need permission to perform the write action'
    )
  } else {
    var oldDirectoryPath = path.join(contentRootPath + req.body.data[0].filterPath, oldName)
    var newDirectoryPath = path.join(contentRootPath + req.body.data[0].filterPath, newName)
    if (await checkForDuplicates(contentRootPath + req.body.data[0].filterPath, newName, req.body.data[0].isFile)) {
      throw new BadRequestError('A file or folder with the name ' + req.body.name + ' already exists.')
    } else {
      await fs.rename(oldDirectoryPath, newDirectoryPath)
      ;(async () => {
        await FileManagerDirectoryContent(req, res, newDirectoryPath + '/', accessDetails).then((data) => {
          return res.status(StatusCodes.OK).json({ files: data })
        })
      })()
    }
  }
}
