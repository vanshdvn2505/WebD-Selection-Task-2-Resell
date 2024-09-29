import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { addToCart, getProducts, likeProduct, removeFromCart, searchProducts, updateCart, updateProfile } from '../controllers/userControllers';
const router = express.Router();

router.get('/getProducts/:page/:limit', isAuthorised, getProducts);
router.patch('/updateProfile', isAuthorised, updateProfile);
router.post('/likeProduct/:id', isAuthorised, likeProduct);
router.post('/addToCart', isAuthorised, addToCart);
router.patch('/updateCart', isAuthorised, updateCart);
router.delete('/removeFromCart/:prodId', isAuthorised, removeFromCart);
router.get('/searchProducts/name/:name/category/:category/location/:location/price/:minPrice-:maxPrice/page/:page/limit/:limit', isAuthorised, searchProducts);

export default router