import { Router } from 'express'
import authRouter from './routes/auth/auth.route'

const mainRouter = Router()

mainRouter.use('/v1/auth', authRouter)


export default mainRouter
