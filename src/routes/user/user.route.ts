import { Router } from "express";
import { Getmany, Getone } from "./user.controller";



const router = Router()

router.get('/user',Getmany)
router.get('/user/:id', Getone)


export default router