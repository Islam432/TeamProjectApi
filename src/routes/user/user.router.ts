import { Router } from "express";
import { togllebar } from "./Toglle/Toggle.controller";
import { test } from "node:test";


const router = Router()

// router.post('/user',() => {})
router.post('/tg', togllebar);
router.get('/test', test)

export default router
