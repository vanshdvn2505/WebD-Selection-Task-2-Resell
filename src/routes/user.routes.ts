import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { addToCart, checkOut, deleteTransaction, getCart, getProducts, getReviews, getTransactions, likeProduct, removeFromCart, reviewProduct, searchProducts, updateCart, updateProfile } from '../controllers/userControllers';
const router = express.Router();

router.get('/getProducts/:page/:limit', isAuthorised, getProducts);
router.patch('/updateProfile', isAuthorised, updateProfile);
router.post('/likeProduct/:id', isAuthorised, likeProduct);
router.post('/addToCart', isAuthorised, addToCart);
router.patch('/updateCart', isAuthorised, updateCart);
router.get('/getReview/:id', isAuthorised, getReviews);
router.post('/reviewProduct/:id', isAuthorised, reviewProduct);
router.get('/getCart', isAuthorised, getCart);
router.delete('/removeFromCart/:prodId', isAuthorised, removeFromCart);
router.get('/searchProducts', isAuthorised, searchProducts);
router.post('/checkOut', isAuthorised, checkOut);
router.get('/getTransactions', isAuthorised, getTransactions);
router.delete('/deleteTransactions/:id', isAuthorised, deleteTransaction);

export default router