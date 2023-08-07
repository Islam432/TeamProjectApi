import { Pool } from 'pg'
import * as dotenv from 'dotenv'
dotenv.config()

export const pool = new Pool({
  host: process.env.HOST,
  user: process.env.PGUSER,
  port: +process.env.PGPORT!,
  password: process.env.PGPASSWORD,
  database: process.env.PGNAME,
  ssl:true
})
