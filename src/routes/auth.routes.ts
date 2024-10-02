import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { forgotPassword, sendOtp, signIn, signOut, signUp, verifyOtp } from '../controllers/authControllers';
const router = express.Router();

// Defining routes for authentication

router.post('/signUp', signUp);

router.post('/signIn', signIn);

router.post('/verifyOtp', verifyOtp);

router.post('/signOut', isAuthorised, signOut);

router.post('/forgotPassword', isAuthorised, forgotPassword);

router.get('/sendOtp', isAuthorised, sendOtp);

// Exporting the router to be used in the main application
export default router