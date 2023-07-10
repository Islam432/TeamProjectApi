import { Request, Response } from "express";
import { pool } from "../../connection";
import { error } from "console";


export function Getmany(req: Request, res: Response) {
  pool.query(`SELECT id, first_name, last_name, email, contact_number, date_of_birth FROM users`, (error, result) => {
    if (error) {
      console.error('warning', error);
    } else {
      const rows = result.rows;
      const users = rows.map(row => {
        return {
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          contact_number: row.contact_number,
          date_of_birth: row.date_of_birth
        };
      });
      console.log(users);
      res.json(users);
    }
  });
}

export function Getone(req: Request, res: Response) {
  // получаем даные с фронта 
    const userId = req.params.id; 
  
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