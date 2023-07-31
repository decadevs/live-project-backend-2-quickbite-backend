import express from 'express'
import {verifyVendor, registerVendor} from "../controllers/vendorControllers"
import { authForVerifiedVendor, auth } from '../middleware/authorizations';
import { upload } from '../middleware/upload';


const router = express.Router();

router.post('/verifyvendor', verifyVendor)
router.post('/registervendor', authForVerifiedVendor, upload.single('cover_image'), registerVendor)


export default router;