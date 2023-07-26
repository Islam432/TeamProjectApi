import { Router } from 'express'
import authorize from '../../middleware/authorize.middleware'
import { CityAll, CityOne, createOne, deleteCity, updateCity } from './city.controller'


const router = Router()

router.route('/').get(CityAll).post(createOne)
router.route('/:id').get(CityOne).delete(deleteCity).patch(updateCity)

export default router
