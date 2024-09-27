import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },

    productList: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Products",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],

    totalAmount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    createdAt: {
        type:  Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
})


const Transaction = mongoose.model("Transactions", transactionSchema);

export default Transaction;