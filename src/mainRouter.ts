import { Router } from 'express'
import authRouter from './routes/auth/auth.route'
import userRouter from './routes/user/user.route'
import levelRouter from './routes/level/level.route'
import courseRouter from './routes/course/course.route'
import filesRouter from './routes/files/file.route'
import authorize from './middleware/authorize.middleware'
const mainRouter = Router()

mainRouter.use('/v1/auth', authRouter)
mainRouter.use('/v1/user', authorize, userRouter)
mainRouter.use('/v1/files', authorize, filesRouter)
mainRouter.use('/v1/level', authorize, levelRouter)
mainRouter.use('/v1/course', authorize, courseRouter)

export default mainRouter
