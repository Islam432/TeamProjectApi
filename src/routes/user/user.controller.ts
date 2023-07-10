import { Request, Response } from "express";
import { pool } from "../../connection";



export async function Getmany(req: Request, res: Response) {
  try {
    const queryResult = await pool.query(`SELECT id, first_name, last_name, email, contact_number, date_of_birth FROM users`);
    const users = queryResult.rows;
    console.log(users);
    res.json(users);
  } catch (error) {
    console.error('warning', error);
  }
}

export async function Getone(req: Request, res: Response) {
  // получаем даные с фронта 
    const userId = await req.params.id; 
  
  //  получаем данные с базы и указываем что только айди отправляет данные на базу , передаем в айди данные
    pool.query(
      'SELECT id, first_name, last_name, email, contact_number, date_of_birth FROM users WHERE id = $1',
      [userId],
      (error, result) => {
        if (error) {
          console.error('Warning', error);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          if (result.rows.length === 0) {
           
            res.status(404).json({ error: 'User not found' });
          } else {
            const user = result.rows[0]; 
  
            res.json(user);
          }
        }
      }
    );
  }