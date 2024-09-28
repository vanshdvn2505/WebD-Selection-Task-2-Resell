import jwt, { JwtPayload } from "jsonwebtoken"; // Import JwtPayload type
import { response_400, response_500 } from "../utils/responseCodes.utils";
import { Request, Response, NextFunction } from "express";
interface DecodedUser {
    email: string;
    name: string;
    role: string;
}

const isAuthorised = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const authToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    try {
        const decoded = await new Promise<DecodedUser | JwtPayload | string>((resolve, reject) => {
            jwt.verify(authToken, jwtKey, (err: Error | null, decoded: JwtPayload | string | undefined) => {
                if (err || !decoded) {
                    reject(err || new Error("Token decoding failed"));
                } else {
                    resolve(decoded as DecodedUser);
                }
            });
        });

        req.decoded = decoded as DecodedUser;  // Cast to DecodedUser
        next();
    } catch (error) {
        response_500(res, "Failed To Authenticate", error);
        return;
    }
};


export default isAuthorised;

