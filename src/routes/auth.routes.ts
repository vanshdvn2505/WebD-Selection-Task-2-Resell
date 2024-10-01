import express from 'express'
import isAuthorised from '../middlewares/isAuthorised.middleware'
import { signIn, signOut, signUp, verifyOtp } from '../controllers/authControllers';
const router = express.Router();

// Defining routes for authentication

router.post('/signUp', signUp);

router.post('/signIn', signIn);

router.post('/verifyOtp', verifyOtp);

router.post('/signOut', isAuthorised, signOut);

// Exporting the router to be used in the main application
export default router