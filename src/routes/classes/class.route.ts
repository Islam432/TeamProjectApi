import { Router } from 'express'
import { createOne, findMany, findOne } from './class.controller'
import { toggle } from './toggle/toggle.controller'

const router = Router()

router.route('/').get(findMany).post(createOne)
router.route('/:id').get(findOne)
router.post('/:id/toggle', toggle)

export default router
