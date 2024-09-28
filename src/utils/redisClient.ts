// import { createClient } from "redis";

// const redisClient = createClient();

// redisClient.on('connect', () => {
//     console.log("Connected To Redis");
// })

// redisClient.on('error', (error) => {
//     console.log("Redis Error " + error);
// })

// redisClient.connect();

// export {redisClient}


import {Redis} from 'ioredis'

const redisClient = new Redis();

export default redisClient