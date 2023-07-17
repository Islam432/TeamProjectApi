import { Router } from 'express'
import authRouter from './routes/auth/auth.route'
import userRouter from './routes/user/user.route'
import filesRouter from './routes/files/file.route'
import authorize from './middleware/authorize.middleware'
import { replaceRequestParams } from './routes/files/middleware/replace-req-params.middleware'
const mainRouter = Router()

mainRouter.use('/auth', authRouter)
mainRouter.use('/user', authorize, userRouter)
mainRouter.use('/files', authorize, replaceRequestParams, filesRouter)

export default mainRouter
