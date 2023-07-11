import { Router } from 'express'
import { findMany, findOne } from './user.controller'
import { togllebar } from './Toglle/Toggle.controller'

const router = Router()

router.get('/', findMany)
router.get('/:id', findOne)
router.post('/:id/toggle', togllebar)

export default router
