import { Request, Response } from 'express'
import { pool } from '../../connection'
import { NotFoundError } from '../../errors'

export async function findMany(req: Request, res: Response) {
  const result = await pool.query(
    `SELECT users.id, users.first_name, users.last_name, users.email, users.contact_number, users.date_of_birth, users.is_active,  users.role, role.role_name
    FROM users
    INNER JOIN role ON users.role = role.id`
  )
  return res.json(result.rows)
}

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `
    SELECT users.id, users.first_name, users.last_name, users.email, users.contact_number, users.date_of_birth, users.is_active, role.role_name
    FROM users
    INNER JOIN role ON users.role = role.id
    WHERE (users.id=$1)`
  const result = await pool.query(query, [id])
  if (result.rows.length <= 0) throw new NotFoundError('User not found')

  return res.json(result.rows[0])

}

