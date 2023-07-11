import { Router } from "express";
import { getImage, uploadFiles } from "./file.controller";
import multer from "multer";
import { multerConfig } from "./file.utils";

const router = Router()

router.route('/').get()


router.get('/get-image', getImage)
router.post('/upload-files', multer(multerConfig).any(), uploadFiles)


export default router