import { Request, Response, NextFunction } from 'express'
import { pattern } from '../file.constants'

export function replaceRequestParams(req: Request, res: Response, next?: NextFunction) {
  req.body.path = req.body.path && req.body.path.replace(pattern, '')
  if (next) next()
}
