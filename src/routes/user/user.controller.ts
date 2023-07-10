import { Request, Response } from 'express'
import { pool } from '../../connection'
import { NotFoundError } from '../../errors'

export async function findMany(req: Request, res: Response) {
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, contact_number, date_of_birth 
    FROM users`
  )
  res.json(result.rows)
}

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, contact_number, date_of_birth 
    FROM users 
    WHERE id = $1`,
    [id]
  )
  if (result.rows.length <= 0) throw new NotFoundError('User not found')
  res.json(result.rows)
}
