import express from "express"
import jwt from 'jsonwebtoken'
import User from "../models/user.model";
import nodemailer, {SentMessageInfo} from 'nodemailer'
import bcrypt from 'bcrypt'
import { Request, Response, NextFunction } from "express";
import { response_200, response_400, response_500 } from "../utils/responseCodes.utils";
import redisClient from "../utils/redisClient";
import { subNotifications } from "../services/notify";
import { DecodedUser } from "../types/global";
// Regex pattern for validating emails
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 

interface user {
    name: string;
    email: string;
    role: string,
    id: string
}

// Function to validate input fields for signup
async function validate(username: string, email: string, password: string, res: Response){
    if(!username || !email || !password){
        response_400(res, 'All fields required')
        return false;
    }
    else if(!emailRegex.test(email)){
        response_400(res, 'Invalid Email');
        return false;
    }
    else if(password.length < 8){
        response_400(res, "Password must be 8 characters long")
        return false;
    }

    const emailCheck = await User.findOne({email: email});
    if(emailCheck){
        response_400(res, "Email Already Exists!");
        return false;
    }
    return true;
}

// Function to send email using Nodemailer
async function sendMail(receiver: nodemailer.SendMailOptions): Promise<SentMessageInfo> {
    const auth = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        port: 465,
        auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.SENDER_PASS,
        },
    });

    return new Promise((resolve, reject) => {
        auth.sendMail(receiver, (error, emailResponse) => {
            if (error) {
                return reject(error);
            }
            resolve(emailResponse);
        });
    });
}

// Function to send OTP email and store OTP in Redis
async function sendEmail(res: Response, email: string): Promise<boolean> {
    const OTP = (Math.floor(Math.random()*9000) + 1000).toString();
    const setOtp = await redisClient.set(`otp:${email}`, OTP, 'EX', 600);
    if(setOtp !== 'OK'){
        console.log("Otp Not Stored in Redis");
        response_500(res, "Internal server Error")
        return false;
    }
    const text = `The OTP for email verification is ${OTP}`;
    const subjectOfEmail = "Email Verification";
    const reciever = {
        from: process.env.SENDER_EMAIL,
        to: [email],
        subject: subjectOfEmail,
        text: text,
    }
    try {
        await sendMail(reciever);
        return true;
    }
    catch(error){
        console.error("Failed to send email:", error);
        response_500(res, "Failed to send email");
        return false;
    }
}

// Function to generate JWT token
async function generateToken(res: Response, user: user){
    try {
        const jwtKey = process.env.JWT_KEY;
        if(!jwtKey){
            return response_500(res, 'JWT Key Not Found');
        }
        const token = jwt.sign(
            {
                name: user.name,
                email: user.email,
                role: user.role,
                id: user.id
            },
            jwtKey,
            {
                expiresIn: "7d",
            }
        );
        res.cookie("token", token, {
            httpOnly: true,
            secure: true
        });
        return token;
    }
    catch(error){
        console.log(error);
        response_500(res, "Token Generation Failed")    
        return ''
    }
}

// User signup function
export const signUp = async (req: Request, res: Response,  next: NextFunction): Promise<void> => {
    try {
        const {name, email, password} = req.body;
        const role = req.body.role || 'buyer';

        if(await validate(name, email, password, res)){
            const hashedPassword = await bcrypt.hash(password, 10);
            const check = await sendEmail(res, email);
            if(!check){
                console.log("Error At Send Email");
                response_500(res, "Internal Server Error");
                return;
            }

            response_200(res, "Email Sent For Vefification", {
                name: name,
                email: email,
                password: hashedPassword,
                role: role
            })
            return;
        }
    }
    catch(error){
        console.log("Error At SignUp " + error);
        response_400(res, "SignUp Failed");
        return;
    }
}

// User signin function
export const signIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            response_400(res, 'All Fields Are Required!');
            return; 
        }

        if(!emailRegex.test(email)){
            response_400(res, 'Invalid Email');
            return; 
        }

        const emailExists = await User.findOne({email: email});
        if(!emailExists){
            response_400(res, "Email Not Found");
            return;
        }
        const userPassword = await bcrypt.compare(password, emailExists.password);  // Compare hashed password
        if(!userPassword){
            response_400(res, 'Incorrect Password');
            return; 
        }

        const user = {
            id: emailExists._id.toString(),
            name: emailExists.name,
            email: emailExists.email,
            role: emailExists.role,
        }

        const token = await generateToken(res, user);

        // Subscribe to user notifications
        subNotifications(user.id);

        response_200(res, "Logged In Successfully")
        return;
    }
    catch(error){
        console.log("Error at SignIn " + error);
        response_400(res, "Error Occured");
        return;
    }
}


// OTP verification function
export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {otp, data} = req.body;
        if(!data.email || !data.name || !data.password || !data.role){
            response_400(res, "Error Occured");
            return;
        }  
        // Retrieve stored OTP from Redis
        const storedOtp = await redisClient.get(`otp:${data.email}`);

        if(!storedOtp || storedOtp !== otp){
            response_400(res, "Invalid OTP");
            return;
        }
        // Delete the OTP from Redis
        const deleted = await redisClient.del(`otp:${data.email}`);
        if(deleted === 0){
            console.log(`OTP not found for ${data.email}`);
            response_400(res, "OTP Deletion Failed");
            return;
        }
        const newUser = new User({
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
        });
        // Save new user to database
        await newUser.save();
        const dummyUser = {
            id: newUser._id.toString(),
            name: data.name,
            email: data.email,
            role: data.role,
        }
        const token = await generateToken(res, dummyUser);

        // Subscribe to user notifications
        subNotifications(dummyUser.id);

        response_200(res, "Registered Successfully");
        return;
    }
    catch(error){
        console.log("Error At Vefify OTP " + error);
        response_400(res, "Error verifying OTP");
        return;    
    }
}

// User sign-out function
export const signOut = async (req: Request, res: Response): Promise<void> => {
    try {
        // Retrieve decoded user data from request
        const user = req.decoded;
        if (user && typeof user === "object" && "email" in user){
            const userExists = await User.findOne({email: user.email});
            if(!userExists){
                response_400(res, 'User Does Not Exists');
                return; 
            }
            res.clearCookie('token',  {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict', 
                path: '/',
            });
            response_200(res, 'Signed Out Successfully')
            return;
        }
        else{
            response_400(res, "Invalid Token Data");
            return;
        }
    }
    catch(error){
        console.log("Error at SignOut " + error);
        response_400(res, "Error occured");    
        return;
    }
}

// Send Otp for forgot password function
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded as DecodedUser;
        if(!user){
            response_400(res, "User Not Found");
            return;
        }  
        const OTP = (Math.floor(Math.random()*9000) + 1000).toString();
        // Storing OTP in redis
        const setOtp = await redisClient.set(`passOTP:${user.email}`, OTP, 'EX', 600);
        if(setOtp !== 'OK'){
            console.log("Otp Not Stored in Redis");
            response_500(res, "Internal server Error")
            return;
    }
        const text = `The OTP for forgot password is ${OTP}`;
        const subjectOfEmail = "Forgot Password";
        const reciever = {
            from: process.env.SENDER_EMAIL,
            to: [user.email],
            subject: subjectOfEmail,
            text: text,
        }
        try {
            // Sending Email
            await sendMail(reciever);
            response_200(res, "OTP Sent Successfully")
            return;
        }
        catch(error){
            console.error("Failed to send email:", error);
            response_500(res, "Failed to send email");
            return;
        }
    }
    catch(error){
        console.log("Error At sendOTP " + error);
        response_400(res, "Error Occured");
        return;    
    }
}

// Forgot Password  Function
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded as DecodedUser;
        if(!user){
            response_400(res, "User Not Found");
            return;
        }

        const {otp, newPassword} = req.body;

        // Validating the OTP
        const storedOtp = await redisClient.get(`passOTP:${user.email}`);
        if(!storedOtp || storedOtp !== otp){
            response_400(res, "Invalid OTP");
            return;
        }
        // Deleting the OTP from redis server
        const deleted = await redisClient.del(`passOTP:${user.email}`);
        if(deleted === 0){
            console.log(`OTP not found for ${user.email}`);
            response_400(res, "OTP Deletion Failed");
            return;
        }

        const currUser = await User.findById(user.id);
        if(!currUser){
            response_400(res, "User Does Not Exists");
            return;
        }
        const hash = await bcrypt.hash(newPassword, 10);
        currUser.password = hash;
        await currUser.save();
        response_200(res, "Password Changed Successfully");
        return;
    }
    catch(error){
        console.log("Error at forgotPassword " + error);
        response_400(res, "Error occured");    
        return; 
    }
}