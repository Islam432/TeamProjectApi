import multer from 'multer'
import { Router } from 'express'
import { uploadFiles } from './file-upload/file-upload.controller'
import { getImage } from './get-image/get-image.controller'
import { downloadFiles } from './file-download/file-download.controller'
import { multerConfig } from './file.utils'
import { fileOperations } from './file-operations/file-operations.controller'

const router = Router()

router.post('/', fileOperations)
router.get('/GetImage', getImage)
router.post('/Upload', multer(multerConfig).any(), uploadFiles)
router.post('/Download', downloadFiles)

export default router
