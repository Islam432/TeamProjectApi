import { Router } from 'express'
import authRouter from './routes/auth/auth.route'
import userRouter from './routes/user/user.route'
const mainRouter = Router()

mainRouter.use('/v1/auth', authRouter)
mainRouter.use('/v1/user',  userRouter)

export default mainRouter
