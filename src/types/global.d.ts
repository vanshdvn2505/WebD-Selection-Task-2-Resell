// @types/express.d.ts
import { Request } from "express";

// Declaring a global augmentation for the Express namespace
declare global{
    namespace Express{
        // Extending the Request interface to include a custom property
        interface Request{
            decoded?: DecodedUser;
        }
    }
}

// Interface to define the structure of the decoded user information
interface DecodedUser{
    email: string;
    name: string;
    role: string;
    id: string;
}