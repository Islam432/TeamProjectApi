import { pool } from './../../connection'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors'

export const findOneLevel = async (req: Request, res: Response) => {
  const { id } = req.params

  const query = `SELECT * FROM level WHERE id=$1`
  const queryParams = [id]
  const result = await pool.query(query, queryParams)

  if (result.rowCount) throw new NotFoundError('Пользователь не найден')

  res.status(StatusCodes.OK).json(result.rows)
}

export const findLevel = async (req: Request, res: Response) => {
  const query = `SELECT * FROM level`
  const result = await pool.query(query)
  if (result.rowCount < 1) throw new NotFoundError('Что-то пошло не так')

  res.status(StatusCodes.OK).json(result.rows)
}

export const sendLevel = async (req: Request, res: Response) => {
  const { level_name } = req.body

  const query = `INSERT INTO level (level_name) VALUES($1)`
  const queryParams = [level_name]
  const result = await pool.query(query, queryParams)
  if (result.rowCount < 1) throw new BadRequestError('Такое название уровня уже существует')

  console.log(result)

  res.status(StatusCodes.OK).json(result.rows)
}

export const updateLevel = async (req: Request, res: Response) => {
  const { id } = req.params
  const { level_name } = req.body

  const query = `UPDATE level SET level_name=$1 WHERE id=$2`
  const queryParams = [level_name, id]
  const result = await pool.query(query, queryParams)
  if (result.rowCount < 1) throw new BadRequestError('Ошибка изменения данных')

  res.status(StatusCodes.OK).json(result.rows)
}

export const deleteLevel = async (req: Request, res: Response) => {
  const { id } = req.params

  const query = `DELETE FROM level WHERE id=$1`
  const queryParams = [id]
  const result = await pool.query(query, queryParams)
  if (result.rowCount < 1) throw new BadRequestError('Такого уровня не существует')

  res.status(StatusCodes.OK).json(result.rows)
}
