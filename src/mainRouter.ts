import { Router } from 'express'
import authRouter from './routes/auth/auth.route'
import userRouter from './routes/user/user.route'
import levelRouter from './routes/level/level.route'
import courseRouter from './routes/course/course.route'
import filesRouter from './routes/files/file.route'
import classesRouter from './routes/classes/class.route'
import regionRoute from './routes/region/region.route'
import cityRoute from './routes/city/city.route'
import branchRoute from './routes/branch/branch.route'
import authorize from './middleware/authorize.middleware'
import { replaceRequestParams } from './routes/files/middleware/replace-req-params.middleware'
const mainRouter = Router()

mainRouter.use('/auth', authRouter)
mainRouter.use('/user', authorize, userRouter)
mainRouter.use('/files', authorize, replaceRequestParams, filesRouter)
mainRouter.use('/level', authorize, levelRouter)
mainRouter.use('/course', authorize, courseRouter)
mainRouter.use('/classes', authorize, classesRouter)
mainRouter.use('/region', authorize, regionRoute)
mainRouter.use('/city', authorize, cityRoute)
mainRouter.use('/branch', authorize, branchRoute)

export default mainRouter
