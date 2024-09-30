import express from "express"
import User from "../models/user.model";
import Product from "../models/product.model";
import { Request, Response, NextFunction } from "express";
import { response_200, response_400, response_500 } from "../utils/responseCodes.utils";
import redisClient from "../utils/redisClient";
import Cart from "../models/cart.model";
import { DecodedUser } from "../types/global";
import Transaction from "../models/transaction.model";


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
            await cart.save();
        }
        else{
            const newCart = new Cart({
                buyer: user.id,
                items: [{product: prodId, quantity}]
            })
            await newCart.save();
        }
        await redisClient.del(`cart:${user.id}:items`);
        response_200(res, "Added To Cart Successfully");
        return;

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
        await redisClient.del(`cart:${user.id}:items`);
        response_200(res, 'Cart Updated Successfully');
        return;

    }
    catch(error){
        console.log("Error At Update Cart " + error);
        response_400(res, "Error Occured");
        return;    
    }
}


export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const {prodId} = req.params;
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
            cart.items.splice(idx, 1);
            await cart.save();
            response_200(res, "Removed Successfully");
        }
        else{
            response_400(res, "Product Not Found In Cart")
        }
        return;
    }
    catch(error){
        console.log("Error At Remove From Cart " + error);
        response_400(res, "Error Occured");
        return;    
    }
}

export const getCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded as DecodedUser;
        if(!user){
            response_400(res, "User Not Found");
            return;
        }
        
        const cache = await redisClient.get(`cart:${user.id}:items`);
        if(cache){
            response_200(res, "Cart Items Found", JSON.parse(cache));
            return;
        }

        const cartId = await Cart.findOne({buyer: user.id}).populate("items.product");
        if(!cartId){
            response_400(res, "Cart Empty");
            return;
        }
        await redisClient.setex(`cart:${user.id}:items`, 1800, JSON.stringify(cartId.items));
        response_200(res, "Items Found", cartId.items);
        return;
        
    }
    catch(error){
        console.log("Error Occured At getCart " + error);
        response_400(res, "Error Occured");
        return;    
    }
}

export const reviewProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params;
        const {text, ratings} = req.body;

        if(!text || !ratings){
            response_400(res, "Enter All Fields");
            return;
        }

        const user = req.decoded as DecodedUser;

        if(!user){
            response_400(res, "User Not Found");
        }

        const prod = await Product.findOne({_id: id});
        if(!prod){
            response_400(res, "Product Not Found");
            return;
        }

        prod.reviews.push({reviewer: user.id, text, ratings});
        await redisClient.del(`product:${id}:reviews`);
        await prod.save();
        response_200(res, "Reviewed Successfully");

    }
    catch(error){
        console.log("Error At Review Product " + error);
        response_400(res, "Error Occured");
        return;    
    }
}

export const getReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params;

        const cachedReviews = await redisClient.get(`product:${id}:reviews`);

        if(cachedReviews){
            response_200(res, "Reviews Found", JSON.parse(cachedReviews));
            return;
        }

        const product = await Product.findById(id).populate('reviews.reviewer', 'name email');

        if (!product) {
            response_400(res, "Product Not Found");
            return;
        }

        const reviews = product.reviews;

        await redisClient.set(`product:${id}:reviews`, JSON.stringify(reviews), 'EX', 900);

        response_200(res, "Reviews Found", reviews);
        return;
    }
    catch(error){
        console.log("Error At Get Reviews " + error);
        response_400(res, "Error Occurred");
        return;
    }
};


export const searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const {title, description, category, location, minPrice, maxPrice, page = "1", limit = "10"} = req.params;

        if(!title && !description && !category && !location && !minPrice && !maxPrice){
            response_400(res, "At least one search parameter must be provided.");
            return;
        }

        const query: any = {};

        if(description){
            query.description = {$regex: new RegExp(description, 'i')};
        }
        
        if(title){
            query.title = {$regex: new RegExp(title, 'i')};
        }
       
        if(category){
            query.category = {$regex: new RegExp(category, 'i')};
        }

        if(location){
            query.location = {$regex: new RegExp(location, 'i')};
        }

        if(minPrice || maxPrice){
            query.price = {};
            if(minPrice){
                query.price.$gte = parseFloat(minPrice);
            }
            if(maxPrice){
                query.price.$lte = parseFloat(maxPrice);
            }
        }

        const skip = (parseInt(page) - 1)*parseInt(limit);
  
        const products = await Product.find(query)
            .skip(skip)
            .limit(parseInt(limit));

       
        const totalProducts = await Product.countDocuments(query);

        response_200(res, "Products fetched successfully", {
            products,
            totalPages: Math.ceil(totalProducts / parseInt(limit)),
            currentPage: parseInt(page)
        });
        return;
    }
    catch(error){
        console.error("Error in searchProducts:", error);
        response_400(res, "Error fetching products");
        return;
    }
};

// export const checkOut = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const user = req.decoded as DecodedUser;

//         if(!user){
//             response_400(res, "User Not Found");
//             return;
//         }

//         const {finalItems} = req.body;

//         if(!finalItems || finalItems.length === 0){
//             response_400(res, "No Items Selected For Checkout");
//             return;
//         }

//         const cart = await Cart.findOne({buyer: user.id}).populate("items.product");

//         if(!cart){
//             response_400(res, "Cart Not Found");
//             return;
//         }

//         let totalAmount = 0;
//         const selectedItems = [];

//         for(const item of finalItems){
//             const cartItem = cart.items.find(i => i.product._id.toString() === item.product);

//             if(!cartItem){
//                 response_400(res, `Item with ID ${item.product} not found in cart`);
//                 return;
//             }

//             totalAmount += item.quantity*item.product.price;
//             selectedItems.push({
//                 product: cartItem.product.id,
//                 quantity: item.quantity
//             });
//         }


//         const newTransaction = new Transaction({
//             buyer: user.id,
//             seller: [...new Set(selectedItems.map(i => i.product.seller))], 
//             productList: selectedItems,
//             totalAmount,
//             status: 'pending'
//         });
//         await newTransaction.save();

//         cart.items = cart.items.filter(i => !selectedItems.some(si => si.product.toString() === i.product.toString()));
//         await cart.save();
//     }
//     catch(error){
//         console.log("Error At checkOut " + error);
//         response_400(res, "Error Occured");
//         return;    
//     }
// }