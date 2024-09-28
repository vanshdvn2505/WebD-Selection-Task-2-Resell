import express from "express"
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";
import { response_200, response_400, response_500 } from "../utils/responseCodes.utils";
import redisClient from "../utils/redisClient";
export interface DecodedUser {
    email: string;
    name: string;
    role: string;
}



export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded;
        const {name, role, location, contact} = req.body;
        const updateFields: { name?: string; role?: string; location?: string; contact?: string; } = {}; 
        if(!user){
            console.log("Error At Update Profile");
            response_400(res, "Token Not Found");
            return;
        }

        if (name) updateFields.name = name;
        if (role) updateFields.role = role;
        if (location) updateFields.location = location;
        if (contact) updateFields.contact = contact;

        const result = await User.findOneAndUpdate(
            {email: user.email},
            {$set: updateFields},
            {new: true}
        )

        if(!result){
            console.log("Error At Update User")
            response_400(res,  "Update Failed");
            return;
        }

        response_200(res, "Profile Updated Successfully");
        return;
    }
    catch(error){
        console.log("Error At Update Profile " + error);
        response_400(res, "Error Occured");
        return;    
    }
}


export const likeProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params;
        const userId = req.decoded?.email;

        if(userId){
            response_400(res, "User Not Authenticated");
            return;
        }

        const user = await User.findOne({email: userId});

        if(!user){
            response_400(res, "User Not Found");
            return;
        }

        const liked = user.likedItems.includes(id);

        if(liked){
            user.likedItems = user.likedItems.filter(i => i !== id);
        }
        else{
            user.likedItems.push(id);
        }

        await user.save();

        response_200(res, liked ? "Unliked Successfully" : "Liked Successfully");
        return;
    }
    catch(error){
        console.log("Error At LikeProduct " + error);
        response_400(res, "Error Occured");
        return;    
    }
}
