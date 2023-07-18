import { Router } from 'express'
import authorize from '../../middleware/authorize.middleware'
import { findOne, findMany, createOne, deleteOne, updateOne } from './level.controller'

const router = Router()

router.route('/').get(findMany).post(createOne)
router.route('/:id').get(findOne).delete(deleteOne).put(updateOne)

export default router