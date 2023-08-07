import { Request, Response } from 'express'
import { pool } from '../../connection'
import { BadRequestError } from '../../errors'
import { StatusCodes } from 'http-status-codes'



// export async function createOnePeople(req:Request , res: Response) {
//     const { id } =  req.params 
//     const {student_id } = req.body

//     const  query = `INSERT INTO enrollment (cycle_id, student_id, )
//     VALUES ($1, $2, )`  
//   const   result = await pool.query(query, [id , student_id,])
//   if (result.rowCount < 1) throw new BadRequestError('человек уже состойт в этом классе')
//   return res.status(StatusCodes.OK).json({ message: "успешно добавлен"})
  
// }