import { Router } from 'express'
import { cycleToggler, findOnne } from './cycle.controller'
 

const router = Router()
router.get('/:id', findOnne)
router.post('/:id/ctoggle', cycleToggler)


export default router

