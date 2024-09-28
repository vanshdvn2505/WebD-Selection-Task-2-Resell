// @types/express.d.ts
import { Request } from "express";

declare global {
    namespace Express {
        interface Request {
            decoded?: DecodedUser;
        }
    }
}

interface DecodedUser {
    email: string;
    name: string;
    role: string;
}