import { Request, Response, query } from 'express'
import { pool } from '../../connection'
import { BadRequestError, NotFoundError } from '../../errors'
import { StatusCodes } from 'http-status-codes'
import { genHash } from '../../utils/auth.utils'
import { UserSchema } from '../../shared/schemas/user.schema'
import { z } from 'zod'

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

export async function createOne(req: Request, res: Response) {
  const { first_name, last_name, email, contact_number, date_of_birth, password } = UserSchema.parse({
    ...req.body,
    date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : undefined,
  })
  let query = `SELECT email FROM users WHERE (email=$1)`
  let result = await pool.query(query, [email])
  if (result.rows.length > 0) throw new BadRequestError('Email уже существует')
  const { salt, hash } = genHash(password)
  query = `
    INSERT INTO users (first_name, last_name, email, contact_number, date_of_birth, salt, hash) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)`
  const queryParams = [first_name, last_name, email, contact_number, date_of_birth, salt, hash]
  result = await pool.query(query, queryParams)
  return res.status(StatusCodes.OK).json({ message: 'Успешно зарегистрировано' })
}

export async function updateOne(req: Request, res: Response) {
  const { id } = req.params
  const { first_name, last_name, email, contact_number, role, is_active } = req.body
  let date_of_birth = req.body.date_of_birth ? z.date().parse(new Date(req.body.date_of_birth)) : null
  let query = `UPDATE users SET`
  let queryParams: string[] = [id]
  if (!first_name && !last_name && !contact_number && !date_of_birth && !email && !role && !is_active) {
    throw new BadRequestError('Не указаны данные для обновления')
  }

  if (first_name) {
    query += ` first_name=$${queryParams.length + 1},`
    queryParams.push(first_name)
  }

  if (last_name) {
    query += ` last_name=$${queryParams.length + 1},`
    queryParams.push(last_name)
  }

  if (contact_number) {
    query += ` contact_number=$${queryParams.length + 1},`
    queryParams.push(contact_number)
  }

  if (date_of_birth) {
    query += ` date_of_birth=$${queryParams.length + 1},`
    queryParams.push(date_of_birth.toString())
  }

  if (email) {
    query += ` email=$${queryParams.length + 1},`
    queryParams.push(email)
  }

  if (role) {
    query += ` role=$${queryParams.length + 1},`
    queryParams.push(role)
  }

  if (is_active) {
    query += ` is_active$${queryParams.length + 1},`
    queryParams.push(is_active)
  }

  query = query.slice(0, -1)
  query += ' WHERE id=$1'
  const result = await pool.query(query, queryParams)
  if (result.rowCount < 1) throw new BadRequestError('Ошибка изменения данных')
  return res.status(StatusCodes.OK).json({ message: 'Успешно обновлено' })
}

export async function deleteOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `DELETE FROM users WHERE id = $1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError(`Пользователь с id = ${id} не найден`)
  return res.status(StatusCodes.OK).json({ message: 'Пользователь успешно удален' })
}
