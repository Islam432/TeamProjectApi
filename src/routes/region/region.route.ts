import { Router } from 'express'
import authorize from '../../middleware/authorize.middleware'
import { createOne, deleteRegion, findAll, findOne, updateRegion } from './region.controller'


const router = Router()

router.route('/').get(findAll).post(createOne)
router.route('/:id').get(findOne).delete(deleteRegion).patch(updateRegion)

export default router
