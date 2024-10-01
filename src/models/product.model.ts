import mongoose from "mongoose";

// Defining the product schema for MongoDB
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true
    },

    description: {
        type: String,
        require: true
    },

    category: {
        type: String,
        require: true
    },

    brand: {
        type: String,
        require: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },

    images: [{
        type: String
    }],

    reviews: [{
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        text: {
            type: String,
            required: true
        },

        ratings: {
            type: Number,
            required: true
        }
    }],
},
{
    timestamps: true // Automatically create 'createdAt' and 'updatedAt' fields
})

// Creating the Product model from the product schema
const Product = mongoose.model("Products", productSchema);

export default Product;