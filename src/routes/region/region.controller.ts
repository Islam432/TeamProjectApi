import { pool } from '../../connection'
import { Request, Response } from 'express'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors'
import { StatusCodes } from 'http-status-codes'

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `SELECT * FROM region where id = $1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError(' Регион не найден')
  return res.status(StatusCodes.OK).json(result.rows)
}
export async function findAll(req: Request, res: Response) {
  const query = `SELECT * FROM region `
  const result = await pool.query(query)
  if (result.rowCount < 1) throw new NotFoundError('Чтото пошло не так')
  return res.status(StatusCodes.OK).json(result.rows)
}
export async function createOne(req: Request, res: Response) {
  const { region_name, country_id } = req.body
  const query = `INSERT INTO region (region_name, country_id) values ($1, $2)`
  const result = await pool.query(query, [region_name, country_id])
  if (result.rowCount < 1) throw new BadRequestError('Данное название уже существует')
  return res.status(StatusCodes.OK).json({ message: 'Регион успешно добавлен' })
}
export async function updateRegion(req: Request, res: Response) {
  const { id } = req.params
  const { region_name } = req.body
  const query = `UPDATE region SET region_name = 1$ WHERE id = 2$`
  const result = await pool.query(query, [region_name, id])
  if (result.rowCount < 1) throw new BadRequestError('Ошибка в изминениях данных')
  return res.status(StatusCodes.OK).json({ messege: 'Успешно обнавлено' })
}
export async function deleteRegion(req: Request, res: Response) {
  const { id } = req.params
  const query = `DELETE FROM region where id = $1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new BadRequestError('Ошибка при удолений региона')
  return res.status(StatusCodes.OK).json({ messege: 'Регион успешно удален' })
}
