import express from "express"
import User from "../models/user.model";
import Product from "../models/product.model";
import { Request, Response, NextFunction } from "express";
import { response_200, response_400, response_500 } from "../utils/responseCodes.utils";
import redisClient from "../utils/redisClient";
import Cart from "../models/cart.model";
import { DecodedUser } from "../types/global";


export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded;
        const {name, location, contact} = req.body;
        const updateFields: { name?: string; location?: string; contact?: string; } = {}; 
        if(!user){
            console.log("Error At Update Profile");
            response_400(res, "Token Not Found");
            return;
        }

        if (name) updateFields.name = name;
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

        if(!userId){
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

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const {page, limit} = req.params;
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;

        const products = await Product.find()
            .populate('seller', 'name email')
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        const total = await Product.countDocuments(); 

        response_200(res, "Products Found", {
            products, 
            totalPages: Math.ceil(total / limitNumber),
            currentPage: page
        });
        return;
    }
    catch(error){
        console.log("Error At getProduct " + error);
        response_400(res, "Error Occured");
        return; 
    }
}


export const addToCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const {prodId, quantity} = req.body;

        const user = req.decoded as DecodedUser;

        if(!user){
            response_400(res, "User Not Found");
        }

        const cart = await Cart.findOne({buyer: user.id});

        if(cart){
            const idx = cart.items.findIndex(i => i.product.toString() === prodId);
            if(idx > -1){
                cart.items[idx].quantity += quantity;
            }
            else{
                cart.items.push({product: prodId, quantity})
            }
        }
        else{
            const newCart = new Cart({
                buyer: user.id,
                items: [{product: prodId, quantity}]
            })
            await newCart.save();
            response_200(res, "Added To Cart Successfully");
            return;
        }

    }
    catch(error){
        console.log("Error At Add To Cart " + error);
        response_400(res, "Error Occured");
        return;    
    }
}


export const updateCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const {prodId, quantity} = req.body;
        const user = req.decoded as DecodedUser;

        if(!user){
            response_400(res, "User Not Found");
        }

        const cart = await Cart.findOne({buyer: user.id});

        if(!cart){
            response_400(res, "Cart Not Found");
            return;
        }

        const idx = cart.items.findIndex(i => i.product.toString() === prodId);

        if(idx > -1){
            cart.items[idx].quantity = quantity;
        }
        else{
            response_400(res, "Product Not Found In Cart");
            return;
        }

        await cart.save();
        response_200(res, 'Cart Updated Successfully');
        return;

    }
    catch(error){
        console.log("Error At Update Cart " + error);
        response_400(res, "Error Occured");
        return;    
    }
}