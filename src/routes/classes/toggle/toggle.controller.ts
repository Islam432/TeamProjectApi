import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError } from '../../../errors'
import { pool } from '../../../connection'

export async function toggle(req: Request, res: Response) {
  const { id } = req.params
  const { open_for_enrollment } = req.body
  if (open_for_enrollment === null) throw new BadRequestError('Invalid request body')
  const query = `UPDATE course_cycle SET open_for_enrollment = $1 WHERE id = $2`
  const result = await pool.query(query, [open_for_enrollment, id])
  if (result.rowCount < 1) throw new NotFoundError(`Класс с id ${id} не найден`)
  return res.status(StatusCodes.OK).json({ message: 'Успешно обновлено' })
}
