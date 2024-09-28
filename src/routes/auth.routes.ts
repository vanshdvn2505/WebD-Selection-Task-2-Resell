import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { signIn, signOut, signUp, verifyOtp } from '../controllers/authControllers';
const router = express.Router();

router.post('/signUp', signUp);
router.post('/signIn', signIn);
router.post('/signOut', isAuthorised, signOut);
router.post('/verifyOtp', verifyOtp);

export default router