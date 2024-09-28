import express from "express"
import dotenv from "dotenv"
import cookieParser from 'cookie-parser';
import cors from "cors"
dotenv.config()
const PORT = process.env.PORT || 9000


const app = express();
// Middleware to parse JSON Bodies-------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}))

// --------------Connect To MongoDB DataBase----------------
import connectDB from "./utils/connectDb"
connectDB();


import authRoutes from './routes/auth.routes'
app.use('/auth', authRoutes);


import userRoutes from './routes/user.routes'
app.use('/user', userRoutes);


import sellerRoutes from './routes/seller.routes'
app.use('/seller', sellerRoutes);





// import { Request, Response } from "express"
// import { response_500 } from "./utils/responseCodes.utils"
// app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
//     console.error(err.stack);
//     response_500(res, 'An unexpected error occurred');
// });


app.get('/', async (req, res) => {
    res.send("Server is running");
})

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`)
})