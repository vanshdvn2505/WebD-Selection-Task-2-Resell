import express from "express"
import jwt from 'jsonwebtoken'
import User from "../models/user.model";
import nodemailer, {SentMessageInfo} from 'nodemailer'
import bcrypt from 'bcrypt'
import { Request, Response, NextFunction } from "express";
import { response_200, response_400, response_500 } from "../utils/responseCodes.utils";
import redisClient from "../utils/redisClient";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
interface user {
    name: string;
    email: string;
    role: string,
}

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
            id: emailExists.id,
            name: emailExists.name,
            email: emailExists.email,
            role: emailExists.role,
        }

        const token = await generateToken(res, user); // Generate and set token
        response_200(res, "Logged In Successfully")
        return;
    }
    catch(error){
        console.log("Error at SignIn " + error);
        response_400(res, "Error Occured");
        return;
    }
}


export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {otp, data} = req.body;
        if(!data.email || !data.name || !data.password || !data.role){
            response_400(res, "Error Occured");
            return;
        }
        const storedOtp = await redisClient.get(`otp:${data.email}`);
        if(!storedOtp || storedOtp !== otp){
            response_400(res, "Invalid OTP");
            return;
        }
        const deleted = await redisClient.del(`otp:${data.email}`);
        if(deleted === 0){
            console.log(`OTP not found for ${data.email}`);
            response_400(res, "OTP Deletion Failed");
            return;
        }
        const dummyUser = {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role
        }
        const token = await generateToken(res, dummyUser);
        const newUser = new User({
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            token: token
        });
        await newUser.save();
        response_200(res, "Registered Successfully");
        return;
    }
    catch(error){
        console.log("Error At Vefify OTP " + error);
        response_400(res, "Error verifying OTP");
        return;    
    }
}


export const signOut = async (req: Request, res: Response): Promise<void> => {
    try {
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