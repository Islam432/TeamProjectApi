import { Request, Response } from 'express'
import { pool } from '../../../connection'
import { QueryResult } from 'pg'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError } from '../../../errors'

export async function toggle(req: Request, res: Response) {
  const { id } = req.params
  const { is_active } = req.body
  if (is_active === null) throw new BadRequestError('Invalid request body')
  const result = await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id])
  res.status(StatusCodes.OK).json(result.rows)
}
