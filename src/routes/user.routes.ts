import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { getProducts, likeProduct, updateProfile } from '../controllers/userControllers';
const router = express.Router();

router.patch('/updateProfile', isAuthorised, updateProfile);
router.post('/likeProduct/:id', isAuthorised, likeProduct);
router.get('/getProducts/:page/:limit', isAuthorised, getProducts);

export default router