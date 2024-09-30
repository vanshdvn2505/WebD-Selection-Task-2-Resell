import express from "express"
import dotenv from "dotenv"
import cookieParser from 'cookie-parser';
import cors from "cors"
import { createServer} from "http";
import chat from "./controllers/chat";
dotenv.config()
const PORT = process.env.PORT || 9000
const CHAT_PORT = process.env.CHAT_PORT || 3000


const app = express();
// Middleware to parse JSON Bodies-------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());
app.use(express.static('src'));
app.use(cors({
    origin: '*',
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


import authRoutes from './routes/auth.routes'
app.use('/auth', authRoutes);


import userRoutes from './routes/user.routes'
app.use('/user', userRoutes);


import sellerRoutes from './routes/seller.routes'
app.use('/seller', sellerRoutes);



app.get('/', async (req, res) => {
    res.send("Server is running");
})

httpServer.listen(CHAT_PORT, () => {
    console.log(`Chat Listening on ${CHAT_PORT}...`)
})

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`)
})