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

    createdAt: {
        type: Date,
        default: Date.now
    }
})


const Product = mongoose.model("Products", productSchema);

export default Product;