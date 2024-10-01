import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { addToCart, checkOut, deleteTransaction, getCart, getProducts, getReviews, getTransactions, likeProduct, removeFromCart, reviewProduct, searchProducts, updateCart, updateProfile } from '../controllers/userControllers';
const router = express.Router();

// Defining routes for authentication

router.patch('/updateProfile', isAuthorised, updateProfile);

router.get('/getProducts/:page/:limit', isAuthorised, getProducts);

router.post('/likeProduct/:id', isAuthorised, likeProduct);

router.get('/getCart', isAuthorised, getCart);

router.post('/addToCart', isAuthorised, addToCart);

router.patch('/updateCart', isAuthorised, updateCart);

router.delete('/removeFromCart/:prodId', isAuthorised, removeFromCart);

router.get('/getReview/:id', isAuthorised, getReviews);

router.post('/reviewProduct/:id', isAuthorised, reviewProduct);

router.get('/searchProducts', isAuthorised, searchProducts);

router.get('/getTransactions', isAuthorised, getTransactions);

router.delete('/deleteTransactions/:id', isAuthorised, deleteTransaction);

router.post('/checkOut', isAuthorised, checkOut);

// Exporting the router to be used in the main application
export default router