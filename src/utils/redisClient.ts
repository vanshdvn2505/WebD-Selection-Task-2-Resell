import {Redis} from 'ioredis'

// Creating a new Redis client instance with specified host and port
const redisClient = new Redis({
    host: 'localhost',
    port: 6379,       
});

export default redisClient