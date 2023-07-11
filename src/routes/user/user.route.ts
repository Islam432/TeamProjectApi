import { Router } from 'express'
import { findMany, findOne } from './user.controller'
import { toggle } from './toggle/toggle.controller'

const router = Router()

router.get('/', findMany)
router.get('/:id', findOne)
router.post('/:id/toggle', toggle)

export default router
