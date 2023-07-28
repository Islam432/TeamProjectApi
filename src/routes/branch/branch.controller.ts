import { BadRequestError, NotFoundError } from '../../errors'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { pool } from '../../connection'

export async function findMany(req: Request, res: Response) {
  const query = `SELECT * FROM branch_office`
  const result = await pool.query(query)
  if (result.rowCount < 1) throw new NotFoundError('Филиалы не найдены')
  return res.status(StatusCodes.OK).json(result.rows)
}

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `SELECT * FROM branch_office WHERE id = $1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError(`Филиал с id ${id} не найден`)
  return res.status(StatusCodes.OK).json(result.rows[0])
}

export async function createOne(req: Request, res: Response) {
  const { name, address_id } = req.body
  const query = `INSERT INTO branch_office (name , address_id ) VALUES($1, $2)`
  const result = await pool.query(query, [name, address_id])
  if (result.rowCount < 1) throw new NotFoundError('такое название уже существует')
  return res.status(StatusCodes.OK).json({ message: 'Создано успешно' })
}

export async function deleteOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `DELETE FROM branch_office WHERE id = $1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError(`Филиал с id ${id} не существует`)
  return res.status(StatusCodes.OK).json({ message: 'Успешно удалено' })
}

export async function updateOne(req: Request, res: Response) {
  const { id } = req.params
  const { name } = req.body
  const query = `UPDATE branch_office SET name = $1 WHERE id = $2`
  const result = await pool.query(query, [name, id])
  if (result.rowCount < 1) throw new NotFoundError('такое название уже существует')
  return res.status(StatusCodes.OK).json(result.rows)
}
