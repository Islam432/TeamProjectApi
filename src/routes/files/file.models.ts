export enum Permission {
  Allow = 'allow',
  Deny = 'deny',
}

export class AccessPermission {
  constructor(
    public  read: boolean,
    public  write: boolean,
    public  writeContents: boolean,
    public  copy: boolean,
    public  download: boolean,
    public  upload: boolean,
    public  message: string
  ) {}
}

export class AccessRules {
  constructor(
    public readonly path: string,
    public readonly role: string,
    public readonly read: boolean,
    public readonly write: boolean,
    public readonly writeContents: boolean,
    public readonly copy: boolean,
    public readonly download: boolean,
    public readonly upload: boolean,
    public readonly isFile: boolean,
    public readonly message: string
  ) {}
}

export class AccessDetails {
  constructor(
    public readonly role: string,
    public readonly rules: AccessRules[]
  ) {}
}
