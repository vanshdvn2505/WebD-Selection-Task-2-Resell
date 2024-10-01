import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { deleteProduct, listProduct, updateProduct } from '../controllers/sellerControllers';
const router = express.Router();

// Defining routes for authentication

router.post('/listProduct', isAuthorised, listProduct);

router.patch('/updateProduct/:id', isAuthorised, updateProduct);

router.delete('/deleteProduct/:id', isAuthorised, deleteProduct);

// Exporting the router to be used in the main application
export default router