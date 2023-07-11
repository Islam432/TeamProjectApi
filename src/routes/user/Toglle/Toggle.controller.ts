import { Request, Response } from "express";
import { pool } from "../../../connection";

export function togllebar(req: Request, res: Response) {
  console.log(req.body)
  console.log(req.params)
  const { is_active } = req.body;
  const { id } = req.params;
  console.log(is_active);

  pool.query(
    'UPDATE users SET is_active = $1 WHERE id = $2',
    [is_active, id],
    (err, result) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log(result.rows);
        res.json(result.rows);
      }
    }
  );
}