import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { addToCart, getCart, getProducts, getReviews, likeProduct, removeFromCart, reviewProduct, searchProducts, updateCart, updateProfile } from '../controllers/userControllers';
const router = express.Router();

router.get('/getProducts/:page/:limit', isAuthorised, getProducts);
router.patch('/updateProfile', isAuthorised, updateProfile);
router.post('/likeProduct/:id', isAuthorised, likeProduct);
router.post('/addToCart', isAuthorised, addToCart);
router.patch('/updateCart', isAuthorised, updateCart);
router.get('/getReview/:id', isAuthorised, getReviews);
router.post('/reviewProduct/:id', isAuthorised, reviewProduct);
router.get('/getcart', isAuthorised, getCart);
router.delete('/removeFromCart/:prodId', isAuthorised, removeFromCart);
router.get('/searchProducts/title/:title/desc/:description/cate/:category/loc/:location/price/:minPrice-:maxPrice/page/:page/limit/:limit', isAuthorised, searchProducts);

export default router