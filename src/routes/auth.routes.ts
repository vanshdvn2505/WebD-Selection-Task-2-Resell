import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { signUp, verifyOtp } from '../controllers/authControllers';
const router = express.Router();

router.post('/signUp', signUp);
router.post('/verifyOtp', verifyOtp);

export default router