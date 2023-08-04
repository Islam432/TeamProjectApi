import { Router } from 'express'

import { findOne, findMany, createOne, deleteOne, updateOne } from './level.controller'

const router = Router()

router.route('/').get(findMany).post(createOne)
router.route('/:id').get(findOne).delete(deleteOne).patch(updateOne)

export default router
