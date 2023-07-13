import { Router } from 'express'
import { downloadFiles, getImage, uploadFiles } from './file.controller'
import multer from 'multer'
import { multerConfig } from './file.utils'
import { replaceRequestParams } from './middleware/replace-req-params.middleware'
import { fileOperations } from './file-operations.controller'

const router = Router()

router.post('/', replaceRequestParams, fileOperations)
router.get('/get-image', replaceRequestParams, getImage)
router.post('/upload', multer(multerConfig).any(), replaceRequestParams, uploadFiles)
router.post('/download', replaceRequestParams, downloadFiles)

export default router
