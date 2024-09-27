import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()


const MONGO_DB_URL = process.env.MONGO_DB_URL
if (!MONGO_DB_URL) {
    throw new Error("MONGO_DB_URL is not defined in the environment variables.");
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_DB_URL);
        console.log("Connected To Database");    
    }
    catch(error){
        console.log("Failed To Connect To Database " + error);
    }
}

export default connectDB;