import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { deleteProduct, listProduct, updateProduct } from '../controllers/sellerControllers';
const router = express.Router();

router.post('/listProduct', isAuthorised, listProduct);
router.patch('/updateProduct/:id', isAuthorised, updateProduct);
router.delete('/deleteProduct/:id', isAuthorised, deleteProduct);

export default router