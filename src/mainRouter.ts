import { Router } from 'express'
import authRouter from './routes/auth/auth.route'
import user from './routes/user/user.router'


const mainRouter = Router()

mainRouter.use('/v1/auth', authRouter)
mainRouter.use('/v1/user', user )



export default mainRouter
