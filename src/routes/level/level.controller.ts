import { pool } from '../../connection'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors'

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `SELECT * FROM level WHERE id=$1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError('Пользователь не найден')
  return res.status(StatusCodes.OK).json(result.rows)
}

export async function findMany(req: Request, res: Response) {
  const query = `SELECT * FROM level`
  const result = await pool.query(query)
  if (result.rowCount < 1) throw new NotFoundError('Что-то пошло не так')
  res.status(StatusCodes.OK).json(result.rows)
}

export async function createOne(req: Request, res: Response) {
  const { level_name } = req.body
  const query = `INSERT INTO level (level_name) VALUES($1)`
  const result = await pool.query(query, [level_name])
  if (result.rowCount < 1) throw new BadRequestError('Такое название уровня уже существует')
  return res.status(StatusCodes.OK).json({ message: 'Создано успешно' })
}

export async function updateOne(req: Request, res: Response) {
  const { id } = req.params
  const { level_name } = req.body
  const query = `UPDATE level SET level_name=$1 WHERE id=$2`
  const result = await pool.query(query, [level_name, id])
  if (result.rowCount < 1) throw new BadRequestError('Ошибка изменения данных')
  return res.status(StatusCodes.OK).json({ message: 'Успешно обновлено' })
}

export async function deleteOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `DELETE FROM level WHERE id=$1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new BadRequestError('Такого уровня не существует')
  return res.status(StatusCodes.OK).json({ message: 'Успешно удалено' })
}
