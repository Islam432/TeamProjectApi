import { pool } from '../../connection'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors'

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `SELECT * FROM course WHERE course_id=$1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError('Пользователь не найден')
  return res.status(StatusCodes.OK).json(result.rows)
}

export async function findMany(req: Request, res: Response) {
  const query = `SELECT course.name, course.level, course.description, course.agenda, level.level_name
    FROM course
    JOIN level ON course.level = level.id`
  const result = await pool.query(query)
  if (result.rowCount < 1) throw new NotFoundError('Что-то пошло не так')
  res.status(StatusCodes.OK).json(result.rows)
}

export async function createOne(req: Request, res: Response) {
  const { name, level, description, agenda } = req.body
  const query = `INSERT INTO course (name, level, description, agenda) VALUES($1, $2, $3, $4)`
  const queryParams = [name, level, description, agenda]
  const result = await pool.query(query, queryParams)
  if (result.rowCount < 1) throw new BadRequestError('Такое название уровня уже существует')
  return res.status(StatusCodes.OK).json({ message: 'Создано успешно' })
}

export async function updateOne(req: Request, res: Response) {
  const { id } = req.params
  const { name, level, description, agenda } = req.body
  let query = `UPDATE course SET`
  let queryParams = [id]
  if (!name && !level && !description && !agenda) {
    throw new BadRequestError('Не указаны данные для обновления')
  }

  if (name) {
    query += ` name=$${queryParams.length + 1},`
    queryParams.push(name)
  }

  if (level) {
    query += ` level=$${queryParams.length + 1},`
    queryParams.push(level)
  }

  if (description) {
    query += ` description=$${queryParams.length + 1},`
    queryParams.push(description)
  }

  if (agenda) {
    query += ` agenda=$${queryParams.length + 1},`
    queryParams.push(agenda)
  }
  query = query.slice(0, -1)
  query += ' WHERE course_id=$1'

  const result = await pool.query(query, queryParams)
  if (result.rowCount < 1) throw new BadRequestError('Ошибка изменения данных')
  return res.status(StatusCodes.OK).json({ message: 'Успешно обновлено' })
}

export async function deleteOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `DELETE FROM course WHERE course_id=$1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new BadRequestError('Такого уровня не существует')
  return res.status(StatusCodes.OK).json({ message: 'Успешно удалено' })
}
