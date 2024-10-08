import express from "express"
import User from "../models/user.model";
import { Request, Response, NextFunction } from "express";
import { response_200, response_400, response_500 } from "../utils/responseCodes.utils";
import redisClient from "../utils/redisClient";
import Product from "../models/product.model";
import { DecodedUser } from "../types/global";
import { priceDrop } from "../services/notify";
// Interface representing a user object
interface user {
    name: string;
    email: string;
    role: string,
    id: string
}

// Controller to list a new product
export const listProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {title, description, category, price, images, brand} = req.body;

        const user = req.decoded as DecodedUser;

        if(!user){
            response_400(res, "Unauthorized");
            return;
        }

        if(user.role != "seller"){
            response_400(res, "User is not a Seller");
            return;
        }

        // Creating a new product instance
        const newProduct = new Product({
            title,
            description,
            category,
            brand,
            price,
            seller: user.id,
            images: images || []
        })

        // Saving the new product to the database
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

// Controller to update an existing product
export const updateProduct = async (req:Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params;
        const user = req.decoded;
        const {title, description, category, price, images, brand} = req.body;
        if(!user){
            response_400(res, "Unauthorized");
            return;
        }
        
        const product = await Product.findById(id);
        
        if(!product){
            response_400(res, "Product not found");
            return;
        }
        
         // Check if the user is authorized to update the product
        if(product.seller.toString() !== user.id){
            response_400(res, "You are not authorized to update this product");
            return;
        }
        const prevPrice = product.price;

         // Updating product properties with new values or keeping existing ones
        product.title = title || product.title;
        product.description = description || product.description;
        product.category = category || product.category;
        product.price = price || product.price;
        product.images = images || product.images;
        product.brand = brand || product.brand;

        await product.save();
        if(prevPrice > product.price){
            await priceDrop(product._id.toString(), product.price);
        }
        response_200(res, "Product Updated Successfully");
        return;
    }
    catch(error){
        console.log("Error At UpdateProduct " + error);
        response_400(res, "Error Occurred");
        return;    
    }
}

// Controller to delete a product
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

        // Check if the user is authorized to delete the product
        if(product.seller.toString() !== user.id){
            response_400(res, "You are not authorized to delete this product");
            return;
        }
        // Deleting the product from the database
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

export const getListedProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded as DecodedUser;
        if(!user){
            response_400(res, "User Not Found");
            return;
        }

        const prods = await Product.find({seller: user.id});
        if(!prods){
            response_400(res, "No Products Found");
            return;
        }
        response_200(res, "Products Found Successfully", prods);
        return;
    }
    catch(error){
        console.log("Error At getListedProducts " + error);
        response_400(res, "Error Occured");
        return;
    }
}