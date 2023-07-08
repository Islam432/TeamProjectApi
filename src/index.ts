import 'express-async-errors'
import express, { Express, urlencoded, json, Request, Response, Router } from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'

// Middleware
import errorHandler from './middleware/error-handler'

// Main Router
import mainRouter from './mainRouter'

dotenv.config()

const app: Express = express()

app.use(cors())
app.use(urlencoded({ extended: true }))
app.use(json())
app.use(morgan('short'))

app.get('/', (req: Request, res: Response) => res.send('Server working!'))
app.use('/api', mainRouter)

app.use(errorHandler)

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
  console.log(`worker pid ${process.pid}`)
})
