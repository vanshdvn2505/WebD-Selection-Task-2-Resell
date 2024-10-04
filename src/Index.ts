import express from "express"
import dotenv from "dotenv"
import cookieParser from 'cookie-parser';
import cors from "cors"
import { createServer} from "http";
import chat from "./controllers/chat";
dotenv.config()

// Define the ports for the server
const PORT = process.env.PORT || 9000
const CHAT_PORT = process.env.CHAT_PORT || 3000
const allowedOrigins = ['http://reselliib2023033.vercel.app/']

const app = express();
// Middleware to parse JSON Bodies-------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());
app.use(express.static('src'));
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}))

// --------------Created A Chat Server----------------
const httpServer = createServer(app);
chat(httpServer);


// --------------Connect To MongoDB DataBase----------------
import connectDB from "./utils/connectDb"
connectDB();

// Importing route handlers for different functionalities
import authRoutes from './routes/auth.routes'
app.use('/auth', authRoutes);


import userRoutes from './routes/user.routes'
app.use('/user', userRoutes);


import sellerRoutes from './routes/seller.routes'
app.use('/seller', sellerRoutes);


// Route handler for the root path
app.get('/', async (req, res) => {
    res.send("Server is running");
})

// Start the chat server and listen on CHAT_PORT
httpServer.listen(CHAT_PORT, () => {
    console.log(`Chat Listening on ${CHAT_PORT}...`)
})

// Start the main server and listen on PORT
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`)
})