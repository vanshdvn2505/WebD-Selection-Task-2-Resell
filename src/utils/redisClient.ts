import {Redis} from 'ioredis'
import dotenv from 'dotenv'
dotenv.config();
const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
// Creating a new Redis client instance with specified host and port
const redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,       
});

export default redisClient