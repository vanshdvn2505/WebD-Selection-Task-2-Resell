import express from "express"
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";
import { response_200, response_400, response_500 } from "../utils/responseCodes.utils";
import redisClient from "../utils/redisClient";
import Product from "../models/product.model";
import { DecodedUser } from "../types/global";
interface user {
    name: string;
    email: string;
    role: string,
    id: string
}


export const listProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {title, description, category, price, images} = req.body;

        const user = req.decoded as DecodedUser;

        if(!user){
            response_400(res, "Unauthorized");
            return;
        }

        if(user.role != "seller"){
            response_400(res, "User is not a Seller");
            return;
        }

        const newProduct = new Product({
            title,
            description,
            category,
            price,
            seller: user.id,
            images: images || []
        })

        await newProduct.save();

        response_200(res, "Product Listed Successfully");
        return;
    }
    catch(error){
        console.log("Error At List Product");
        response_400(res, "Error Occured");
        return;    
    }
}


export const updateProduct = async (req:Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params;
        const user = req.decoded;
        const {title, description, category, price, images} = req.body;

        if(!user){
            response_400(res, "Unauthorized");
            return;
        }

        const product = await Product.findById(id);

        if(!product){
            response_400(res, "Product not found");
            return;
        }

        if(product.seller.toString() !== user.id){
            response_400(res, "You are not authorized to update this product");
            return;
        }

        product.title = title || product.title;
        product.description = description || product.description;
        product.category = category || product.category;
        product.price = price || product.price;
        product.images = images || product.images;

        await product.save();

        response_200(res, "Product Updated Successfully");
        return;
    }
    catch(error){
        console.log("Error At UpdateProduct " + error);
        response_400(res, "Error Occurred");
        return;    
    }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params;
        const user = req.decoded;

        if(!user){
            response_400(res, "Unauthorized");
            return;
        }

        const product = await Product.findById(id);

        if(!product){
            response_400(res, "Product not found");
            return;
        }

        
        if(product.seller.toString() !== user.id){
            response_400(res, "You are not authorized to delete this product");
            return;
        }

        await Product.findByIdAndDelete(id);
        response_200(res, "Product Deleted Successfully");
        return;
    }
    catch(error){
        console.log("Error At DeleteProduct " + error);
        response_400(res, "Error Occurred");
        return; 
    }
}