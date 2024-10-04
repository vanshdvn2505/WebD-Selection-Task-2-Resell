import { Server } from "socket.io";
import { Redis } from "ioredis";
import { createAdapter } from 'socket.io-redis';
import redisClient from "../utils/redisClient";
import dotenv from "dotenv"
dotenv.config()
const allowedOrigins = ['http://reselliib2023033.vercel.app/']
// Function to store a message in Redis for a user
const store = async (user: string, message: {sender: string; message: string; timestamp: Date;}) => {
    const key = `chat:${user}`;
    await redisClient.rpush(key, JSON.stringify(message));
};

// Function to retrieve chat history for a user from Redis
const history = async (name: string) => {
    const key = `chat:${name}`;
    const messages = await redisClient.lrange(key, 0, -1);
    return messages.map(msg => JSON.parse(msg));
};

// Main chat function to initialize the Socket.IO server
const chat = (httpServer: any) => {

    const pubClient: Redis = redisClient;
    const subClient: Redis = redisClient.duplicate();
    const io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    // Using Redis adapter for scaling Socket.IO
    io.adapter(createAdapter({ pubClient, subClient }));

    const users: {[key: string]: string} = {};

    io.on('connection', (socket) => {
        console.log("A user connected : " + socket.id);

        // Handling user registration
        socket.on('register', (name: string) => {
            users[name] = socket.id;
            console.log(`${name} registered ID: ${socket.id}`);

            // Retrieving chat history and sending it to the newly connected user
            history(name).then(messages => {
                socket.emit('history', messages);
            });
        })

         // Handling private messages
        socket.on('private_mess', async ({recipient, message, sender}: {recipient: string, message: string, sender: string}) => {
            const rId = users[recipient];
            const data = {sender, message, timestamp: new Date()};

            socket.emit('private_mess', data);

            if(rId){
                socket.to(rId).emit('private_mess', data);
            }
            // Storing the message in Redis for both sender and recipient
            await store(sender, data);
            await store(recipient, data);
        })
        socket.on('disconnet', () => {
            // console.log("User Disconnected " + socket.id);
            for (const [name, id] of Object.entries(users)) {
                if (id === socket.id) {
                    delete users[name];
                    // console.log(`${name} disconnected`);
                    break;
                }
            }
        })
    })
};

export default chat;