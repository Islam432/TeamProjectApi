import { Router } from 'express'
import { signin, signup } from './auth.controller'
import authorize from '../../middleware/authorize.middleware'

const router = Router()

router.post('/signin', signin)
router.post('/signup', signup)

export default router
