import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { deleteProduct, getListedProducts, listProduct, updateProduct } from '../controllers/sellerControllers';
const router = express.Router();

// Defining routes for authentication

router.post('/listProduct', isAuthorised, listProduct);

router.patch('/updateProduct/:id', isAuthorised, updateProduct);

router.delete('/deleteProduct/:id', isAuthorised, deleteProduct);

router.get('/getListedProducts', isAuthorised, getListedProducts);

// Exporting the router to be used in the main application
export default router