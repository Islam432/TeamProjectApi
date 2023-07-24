import { Request, Response } from 'express'
import { QueryResult } from 'pg'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError } from '../../errors'
import { pool } from '../../connection'

export async function cycleToggler(req: Request, res: Response) {
  console.log(req.body)
  const { id } = req.params
  const { open_for_enrollment } = req.body
  console.log(open_for_enrollment)
  if ( open_for_enrollment === null) throw new BadRequestError('Invalid request body')
  const result = await pool.query('UPDATE course_cycle SET open_for_enrollment = $1 WHERE id = $2', [ open_for_enrollment , id])
  res.status(StatusCodes.OK).json(result.rows)
  console.log(result.rows)
}

export async function findOnne(req: Request, res: Response) {
  const { id } = req.params
  const result = await pool.query(
    `SELECT id FROM courses_cycle 
    WHERE id = $1`,
    [id]
  )
  if (result.rows.length <= 0) throw new NotFoundError('User not found')
  res.json(result.rows)
  console.log(result.rows)
}
