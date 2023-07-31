import { Router } from 'express'
import authorize from '../../middleware/authorize.middleware'
import { findAll, findOne, createOne, updateOne, deleteOne } from './city.controller'

const router = Router()

router.route('/').get(findAll).post(createOne)
router.route('/:id').get(findOne).delete(deleteOne).patch(updateOne)

export default router
