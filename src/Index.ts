import express from "express"
import dotenv from "dotenv"
import cors from "cors"
dotenv.config()
const PORT = process.env.PORT || 9000


const app = express();
// Middleware to parse JSON Bodies-------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}))

// --------------Connect To MongoDB DataBase----------------
import connectDB from "./utils/connectDb"
connectDB();








app.get('/', async (req, res) => {
    res.send("Server is running");
})

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`)
})