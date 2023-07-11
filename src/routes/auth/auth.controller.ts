import e, { Request, Response } from 'express'
import { pool } from '../../connection'
import { genHash } from '../../utils/auth.utils'
import { UserSchema } from '../../shared/schemas/user.schema'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError } from '../../errors'

export function signin(req: Request, res: Response) {}

export async function signup(req: Request, res: Response) {
  const { first_name, last_name, email, contact_number, date_of_birth, password } = UserSchema.parse({
    ...req.body,
    date_of_birth: new Date(req.body.date_of_birth),
  })

  let query = `SELECT email FROM users WHERE email=$1`
  let result = await pool.query(query, [email])
  if (result.rows.length > 0) throw new BadRequestError('Email уже существует')

  const { salt, hash } = genHash(password)
  query = `
    INSERT INTO users (first_name, last_name, email, contact_number, date_of_birth, salt, hash) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)`
  const queryParams = [first_name, last_name, email, contact_number, date_of_birth, salt, hash]
  result = await pool.query(query, queryParams)

  res.status(StatusCodes.OK).json(result.rows)
}
