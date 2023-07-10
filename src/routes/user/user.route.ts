import { Router } from 'express'
import { findMany, findOne } from './user.controller'

const router = Router()

router.get('/user', findMany)
router.get('/user/:id', findOne)

export default router
