import redisClient from "../utils/redisClient";
import nodemailer, { SentMessageInfo } from 'nodemailer';
import Product from "../models/product.model";
import User from "../models/user.model";
const pub = redisClient.duplicate();


// Function to send an email using nodemailer
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

// Function to send a notification email to a user
export const notificationEmail = async (email: string, sub:  string, data: string): Promise<boolean> => {
    const text = `${data}`;
    const subjectOfEmail = sub;
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
        return false;
    }
}

// Function to notify a user with a message
const notifyUser = async (userId: string, message: string) => {
    pub.publish(`user:${userId}:notifications`, JSON.stringify({message}));
};

// Function to handle price drop notifications
export const priceDrop = async (prodId: string, price: number) => {
    const prod = await Product.findById(prodId);
    if(!prod){
        return;
    }
    const people = await User.find({likedItems: prodId})

    // Loop through each user to send notifications
    for(const i of people){
        const message = `The Price of ${prod.title} has dropped to ${price}`;
        await notifyUser(i._id.toString(), message);
        await notificationEmail(i.email, `Price Drop Alert: ${prod.title}`, message);
    }
}

// Function to subscribe a user to their notification channel
export const subNotifications = async (userId: string): Promise<void> => {
    const sub = redisClient.duplicate();
    const channel = `user:${userId}:notifications`;
    sub.subscribe(channel, (err, count) => {
        if(err){
            console.log("Failed To Subscribe");
        }
        else{
            console.log("Subscribed Successfully");
            
        }
    })

    // Listener for incoming messages on the subscribed channel
    sub.on('message', (channel, message) => {
        // console.log(`Received ${message} from ${channel}`);
    })
};