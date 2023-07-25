import { Router } from 'express'
import { createOne, deleteOne, findAll, findOne, updateOne } from './region.controller'

const router = Router()

router.route('/').get(findAll).post(createOne)
router.route('/:id').get(findOne).delete(deleteOne).patch(updateOne)

export default router
