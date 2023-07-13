export enum Permission {
  Allow = 'allow',
  Deny = 'deny',
}

export class AccessPermission {
  constructor(
    public read: boolean,
    public write: boolean,
    public writeContents: boolean,
    public copy: boolean,
    public download: boolean,
    public upload: boolean,
    public message: string
  ) {}
}

export class AccessRules {
  constructor(
    public readonly path: string,
    public readonly role: string,
    public readonly read: string | undefined,
    public readonly write: string | undefined,
    public readonly writeContents: string | undefined,
    public readonly copy: string | undefined,
    public readonly download: string | undefined,
    public readonly upload: string | undefined,
    public readonly isFile: boolean,
    public readonly message: string | undefined
  ) {}
}

export class AccessDetails {
  constructor(
    public role: string,
    public rules: AccessRules[] | null
  ) {}
}

export class FileClass {
  constructor(
    public name: string = '',
    public size: number | string = 0,
    public isFile: boolean = false,
    public dateModified: Date | null = null,
    public dateCreated: Date | null = null,
    public type: string = '',
    public filterPath: string = '',
    public permission: AccessPermission | null = new AccessPermission(true, true, true, true, true, true, ''),
    public hasChild: boolean = false,
    public location: string = '',
    public multipleFiles: boolean = false
  ) {}
}

export type UploadFilesReqBody = {
  path: string
  action: 'save' | 'remove'
  filename: string
  data: {
    name: string
    size: string
    isFile: boolean
    dateModified: string
    dateCreated: string
    type: string
    filterPath: string
    permission: any
    hasChild: boolean
    _fm_id: string
  }
}

export type DownloadFilesReqBody = {
  downloadInput: {
    action: 'download'
    path: string
    names: string[]
    data: [
      {
        dev: number
        mode: number
        nlink: number
        uid: number
        gid: number
        rdev: number
        blksize: number
        ino: number
        size: number
        blocks: number
        atimeMs: number
        mtimeMs: number
        ctimeMs: number
        birthtimeMs: number
        atime: string
        mtime: string
        ctime: string
        birthtime: string
        name: string
        isFile: boolean
        dateModified: string
        dateCreated: string
        filterPath: string
        type: string
        permission: any
        hasChild: boolean
        _fm_created: string
        _fm_modified: string
        _fm_iconClass: string
        _fm_imageUrl: string
        _fm_imageAttr: {
          alt: string
        }
        _fm_htmlAttr: {
          class: string
          title: string
        }
      },
    ]
  }
  path: any
}
