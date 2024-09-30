import mongoose from "mongoose";

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
    timestamps: true
})


const Product = mongoose.model("Products", productSchema);

export default Product;