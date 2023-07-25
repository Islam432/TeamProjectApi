import { Router } from 'express'
import { createOne, findMany, findOne, updateOne } from './class.controller'
import { toggle } from './toggle/toggle.controller'

const router = Router()

router.route('/').get(findMany).post(createOne)
router.route('/:id').get(findOne).patch(updateOne)
router.post('/:id/toggle', toggle)

export default router
