import { Router } from 'express'
import { createOne, deleteOne, findMany, findOne, updateOne } from './user.controller'
import { toggle } from './toggle/toggle.controller'

const router = Router()

router.route('/').post(createOne).get(findMany)
router.route('/:id').get(findOne).patch(updateOne).delete(deleteOne)
router.post('/:id/toggle', toggle)

export default router
