import express from "express"
import User from "../models/user.model";
import Product from "../models/product.model";
import { Request, Response, NextFunction } from "express";
import { response_200, response_400, response_500 } from "../utils/responseCodes.utils";
import redisClient from "../utils/redisClient";
import Cart from "../models/cart.model";
import { DecodedUser } from "../types/global";
import Transaction from "../models/transaction.model";

// Update the user profile
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

        // Prepare fields to be updated
        if (name) updateFields.name = name;
        if (location) updateFields.location = location;
        if (contact) updateFields.contact = contact;

         // Update user in the database
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

// Like or unlike a product
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
         // Check if the product is already liked
        const liked = user.likedItems.includes(id);

        if(liked){
            // If liked, remove from liked items
            user.likedItems = user.likedItems.filter(i => i !== id);
        }
        else{
            // If not liked, add to liked items
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

// Function to get paginated products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const {page, limit} = req.params;
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;

        // Fetch products from the database with pagination
        const products = await Product.find()
            .populate('seller', 'name email')
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        // Get total product count
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

// Function to add a product to the user's cart
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
                // If exists, increase quantity
                cart.items[idx].quantity += quantity;
            }
            else{
                // If not exists, add new item
                cart.items.push({product: prodId, quantity})
            }
            await cart.save();
        }
        else{
            // Create a new cart if none exists
            const newCart = new Cart({
                buyer: user.id,
                items: [{product: prodId, quantity}]
            })
            await newCart.save();
        }
        // Invalidate cache
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

// Function to update quantity of a product in the cart
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
        // If found, update quantity
        const idx = cart.items.findIndex(i => i.product.toString() === prodId);

        if(idx > -1){
            cart.items[idx].quantity = quantity;
        }
        else{
            response_400(res, "Product Not Found In Cart");
            return;
        }

        await cart.save();
        // Invalidate cache
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

// Function to remove a product from the cart
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
            // If found, remove it from the cart
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

// Function to get the current user's cart items
export const getCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded as DecodedUser;
        if(!user){
            response_400(res, "User Not Found");
            return;
        }
         // Check Redis cache for cart items
        const cache = await redisClient.get(`cart:${user.id}:items`);
        if(cache){
            response_200(res, "Cart Items Found", JSON.parse(cache));
            return;
        }
        // Find user's cart and populate product details
        const cartId = await Cart.findOne({buyer: user.id}).populate("items.product");
        if(!cartId){
            response_400(res, "Cart Empty");
            return;
        }
        // Cache cart items
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

// Function to create a new review for a product
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
        // Invalidate Cache
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

// Function to get reviews for a specific product
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
        // Cache reviews
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

// Function to search for products based on various criteria
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const {title, description, category, brand, page = 1, limit = 10} = req.query;

        // Build a dynamic query object
        const query: any = {};

        // If title is provided, use a regular expression for case-insensitive search
        if(title){
            query.title = {$regex: new RegExp(title as string, 'i')};
        }

        // If description is provided, use a regular expression for case-insensitive search
        if(description){
            query.description = {$regex: new RegExp(description as string, 'i')};
        }

        // If category is provided, match exactly (assuming category is an exact match)
        if(category){
            query.category = category;
        }

        if(brand){
            query.brand = { $regex: new RegExp(brand as string, 'i') };
        }
        console.log(query);

        //Pagination Settings
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Search for products that match the query
        const products = await Product.find(query).skip(skip).limit(limitNum);

        const totalProducts = await Product.countDocuments(query);

        if(!products || products.length === 0){
            response_400(res, "No products found");
            return;
        }

        // Respond with the matching products
        response_200(res, "Products fetched successfully", {
            products,
            total: totalProducts,
            page: pageNum,
            pages: Math.ceil(totalProducts / limitNum),
        });
        return;
    }
    catch(error){
        console.error("Error in searchProducts:", error);
        response_400(res, "Error fetching products");
        return;
    }
};

// Function to checkout and process the user's cart
export const checkOut = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded as DecodedUser;

        if(!user){
            response_400(res, "User Not Found");
            return;
        }

        const {finalItems} = req.body;
        if(!finalItems || finalItems.length === 0){
            response_400(res, "No Items Selected For Checkout");
            return;
        }

        const cart = await Cart.findOne({buyer: user.id}).populate("items.product");

        if(!cart){
            response_400(res, "Cart Not Found");
            return;
        }

        const checkedItems = cart.items.filter(item => finalItems.includes(item.product._id.toString()));

        let totalAmt = 0;
        checkedItems.forEach(item => {
            // @ts-ignore
            totalAmt += item.product.price*item.quantity;
        })
        // Create a new transaction
        const newTransaction = new Transaction({
            buyer: user.id,
            productList: checkedItems.map(item => ({
                product: item.product._id,
                quantity: item.quantity
            })),
            totalAmount: totalAmt,
            status: "pending"
        });

        await newTransaction.save();
        // Clear the user's cart after checkout
        for(let i = cart.items.length - 1; i >= 0; i--){
            if(finalItems.includes(cart.items[i].product._id.toString())){
                cart.items.splice(i, 1);
            }
        }
        await cart.save();
        response_200(res, "Transaction Successfull");
        return;
    }
    catch(error){
        console.log("Error At checkOut " + error);
        response_400(res, "Error Occured");
        return;    
    }
}

// Function to get all transactions for the current user
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.decoded as DecodedUser;
        if(!user){
            response_400(res, "User Not Found");
            return;
        }
         // Fetch transactions associated with the user's ID and populate product details
        const trans = await Transaction.find({buyer : user.id}).populate("productList.product");
        if(!trans){
            response_400(res, "No Transactions Found");
        }

        response_200(res, "Transactions Found", trans);
        return;
    }
    catch(error){
        console.log("Error At getTranactions " + error);
        response_400(res, "Error Occured");
        return;    
    }
}

// Function to delete a specific transaction
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params;
        const user = req.decoded as DecodedUser;
        if(!user){
            response_400(res, "User Not Found");
            return;
        }

        // Find and delete the transaction by its ID
        const trans = await Transaction.findByIdAndDelete(id);
        if(!trans){
            response_400(res, "Transaction Not Deleted : Error");
            return;
        }

        response_200(res, "Transaction Deleted Successfully");
        return;
    }
    catch(error){
        console.log("Error At deleteTransaction " + error);
        response_400(res, "Error Occured");
        return;    
    }
}