import e, { Request, Response } from 'express'
import { pool } from '../../connection'
import { genHash, validPassword } from '../../utils/auth.util'
import { userSchema } from './user.schema'

export function signin(req: Request, res: Response) {}

export async function signup(req: Request, res: Response) {
  const { first_name, last_name, email, contact_number, date_of_birth, password } = req.body

  const validatedData = userSchema.parse({
    first_name,
    last_name,
    email,
    contact_number,
    date_of_birth,
    password,
  })

  const { salt, hash } = genHash(password)
  validPassword(password, hash, salt)

  const query = `INSERT INTO users (first_name, last_name, email, contact_number, date_of_birth, salt, hash) VALUES ($1, $2, $3, $4, $5, $6, $7)`
  const paramsQuery = [
    validatedData.first_name,
    validatedData.last_name,
    validatedData.email,
    validatedData.contact_number,
    validatedData.date_of_birth,
    salt,
    hash,
  ]

  pool.query(query, paramsQuery, (error, result) => {
    if (error) {
      console.log(error.message)
      throw new Error()
    } else {
      res.json(result.rows)
    }
  })
}
