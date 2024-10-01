import jwt, { JwtPayload } from "jsonwebtoken";
import { response_400, response_500 } from "../utils/responseCodes.utils";
import { Request, Response, NextFunction } from "express";

// Interface representing the decoded user information from the JWT
interface DecodedUser {
    email: string;
    name: string;
    role: string;
    id: string;
}

// Middleware to check if the user is authorized
const isAuthorised = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
     // Retrieving the token from cookies or authorization header
    const authHeader = req.cookies?.token || req.headers.authorization;
    
    if (!authHeader) {
        response_400(res, "Token Not Found");
        return;
    }

    const jwtKey = process.env.JWT_KEY;
    if (!jwtKey) {
        response_500(res, "Internal Server Error");
        return;
    }
    // Extract the token, removing 'Bearer ' prefix if it exists
    const authToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    try {
        const decoded = await new Promise<DecodedUser  | string>((resolve, reject) => {
            jwt.verify(authToken, jwtKey, (err: Error | null, decoded: JwtPayload | string | undefined) => {
                if (err || !decoded) {
                    reject(err || new Error("Token decoding failed"));
                } else {
                    resolve(decoded as DecodedUser);
                }
            });
        });
        // Store the decoded user information in the request object
        req.decoded = decoded as DecodedUser;
        next();
    } catch (error) {
        response_500(res, "Failed To Authenticate", error);
        return;
    }
};


export default isAuthorised;

