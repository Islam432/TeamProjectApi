import { Router } from 'express'
import authorize from '../../middleware/authorize.middleware'
import { deleteLevel, findLevel, findOneLevel, sendLevel, updateLevel } from './level.control'

const router = Router()

router.route('/').get(authorize, findLevel).post(authorize, sendLevel)
router.route('/:id').get(authorize, findOneLevel).delete(authorize, deleteLevel).put(authorize, updateLevel)

export default router
