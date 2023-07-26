import { Router } from 'express'
import { createOne, deleteOne, findMany, findOne, updateOne,} from './branch.controller'


const router = Router()

router.route('/').get(findMany).post(createOne)
router.route('/:id').get(findOne).delete(deleteOne).patch(updateOne)


export default router
