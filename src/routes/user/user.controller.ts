import { Request, Response } from "express";
import { pool } from "../../connection";
import { error } from "console";


export function Getmany(req: Request, res: Response){
pool.query(`SELECT  (id, first_name, last_name, email, contact_number ,date_of_birth)
 FROM users`, (error, result) =>{
if (error){
console.error('warning' ,error)
}else{
    console.log(result.rows)
res.json(result.rows)
}
 })
}
export function Getone(req: Request, res: Response) {
    const userId = req.params.id; 
  
    
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