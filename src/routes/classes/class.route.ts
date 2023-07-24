import { Router } from 'express'
import { createOne, findMany, findOne } from './class.controller'

const router = Router()

router.route('/').get(findMany).post(createOne)
router.route('/:id').get(findOne)

export default router
