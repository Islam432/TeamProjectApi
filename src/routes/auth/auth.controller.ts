import e, { Request, Response } from 'express'
import { pool } from '../../connection'
import { genHash, issueJWT, validPassword } from '../../utils/auth.util'
import { UserSchema } from '../../shared/schemas/user.schema'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors'

export async function signin(req: Request, res: Response) {
  const { email, password } = req.body
  let query = `SELECT email, role, hash, salt, is_active FROM users WHERE (email=$1)`
  const result = await pool.query(query, [email])
  if (result.rows.length < 1) throw new NotFoundError('Пользователь не найден')
  const [dbUser] = result.rows
  if (dbUser.is_active === false) throw new Error('Дождитесь одобрения администратора')
  const validPass = validPassword(password, dbUser.hash, dbUser.salt)
  if (!validPass) throw new UnauthorizedError('Не верный пароль')
  return res.status(StatusCodes.OK).json(issueJWT(dbUser))
}

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
  return res.status(StatusCodes.OK).json(result.rows)
}
