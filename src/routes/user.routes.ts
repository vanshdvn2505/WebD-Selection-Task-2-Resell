import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { likeProduct, updateProfile } from '../controllers/userControllers';
const router = express.Router();

router.patch('/updateProfile', isAuthorised, updateProfile);
router.post('/likeProduct/:id', isAuthorised, likeProduct);

export default router