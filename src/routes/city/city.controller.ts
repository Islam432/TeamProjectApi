import { pool } from '../../connection'
import { Request, Response } from 'express'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors'
import { StatusCodes } from 'http-status-codes'

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `SELECT * FROM city where id = $1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError('Город не найден')
  return res.status(StatusCodes.OK).json(result.rows[0])
}
export async function findAll(req: Request, res: Response) {
  const query = `SELECT * FROM city `
  const result = await pool.query(query)
  if (result.rowCount < 1) throw new NotFoundError('Города не найдены')
  return res.status(StatusCodes.OK).json(result.rows)
}
export async function createOne(req: Request, res: Response) {
  const { city_name, region_id } = req.body
  const query = `INSERT INTO city (city_name, region_id) values ($1, $2)`
  const result = await pool.query(query, [city_name, region_id])
  if (result.rowCount < 1) throw new BadRequestError('Данное название уже существует')
  return res.status(StatusCodes.OK).json({ message: 'Город успешно добавлен' })
}
export async function updateOne(req: Request, res: Response) {
  const { id } = req.params
  const { city_name } = req.body
  const query = `UPDATE city SET city_name = 1$ WHERE id = 2$`
  const result = await pool.query(query, [city_name, id])
  if (result.rowCount < 1) throw new BadRequestError('Ошибка в изминениях данных')
  return res.status(StatusCodes.OK).json({ messege: 'Успешно обнавлено' })
}
export async function deleteOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `DELETE FROM city where id = $1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new BadRequestError('Ошибка при удолений города')
  return res.status(StatusCodes.OK).json({ messege: 'Город успешно удален' })
}
// это круд система