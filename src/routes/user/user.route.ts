import { Router } from 'express'
import { findMany, findOne } from './user.controller'

const router = Router()

router.get('/', findMany)
router.get('/:id', findOne)

export default router
