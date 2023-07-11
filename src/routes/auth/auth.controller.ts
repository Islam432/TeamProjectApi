import e, { Request, Response } from 'express'
import { pool } from '../../connection'
import { genHash, issueJWT, validPassword } from '../../utils/auth.util'
import { UserSchema } from '../../shared/schemas/user.schema'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError } from '../../errors'

export async function signin(req: Request, res: Response) {
  const { email, password } = req.body

  let query = `SELECT email, role FROM users WHERE (email=$1)`
  let queryParams = [email]
  const infoUser = await pool.query(query, queryParams)

  if (infoUser.rows.length < 1) throw new BadRequestError('Пользователь не найден')
  query = `SELECT hash, salt FROM users WHERE (email=$1)`
  queryParams = [email]
  const dataPass = (await pool.query(query, queryParams)).rows[0]
  if (dataPass.length < 1) throw new BadRequestError('Пользователь не найден')
  const validPass = validPassword(password, dataPass.hash, dataPass.salt)
  if (!validPass) throw new BadRequestError('Не верный пароль')

  res.status(StatusCodes.OK).json(issueJWT(infoUser.rows[0]))
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

  res.status(StatusCodes.OK).json(result.rows)
}
