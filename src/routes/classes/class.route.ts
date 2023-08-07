import { Router } from 'express'
import { createOne, createOnePeople, deleteOne, findMany, findOne, updateOne } from './class.controller'
import { toggle } from './toggle/toggle.controller'


const router = Router()

router.route('/').get(findMany).post(createOne)
router.route('/:id').get(findOne).patch(updateOne).delete(deleteOne)
router.post('/:id/toggle', toggle)
router.post('/:id/people', createOnePeople)


export default router
