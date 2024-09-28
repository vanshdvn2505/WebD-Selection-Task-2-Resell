import jwt from "jsonwebtoken"
import { response_400, response_500 } from "../utils/responseCodes.utils"
import { Request, Response, NextFunction } from "express"

const isAuthorised = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"]
    if(!authHeader){
        console.log("Token Not Found")
        return response_400(res, "Token Not Found");
    }
    const jwtKey = process.env.JWT_KEY;
    if(!jwtKey){
        console.log("JWT Key Not Available")
        return response_500(res, "Internal Server Error", "");
    }

    const authToken = authHeader.slice(7);

    try {
        const decoded = await new Promise<string | object>((resolve, reject) => {
            jwt.verify(authToken, jwtKey, (err, decoded) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded as string | object);
                }
            });
        });

        req.decoded = decoded;
        next();
    }
    catch(error){
        return response_500(res, "Failed To Authenticate", error);    
    }
}

export default isAuthorised