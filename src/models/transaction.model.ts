import mongoose from "mongoose";

// Defining the transaction schema for MongoDB
const transactionSchema = new mongoose.Schema({
    buyer: {
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
        enum: ['pending', 'completed', 'cancelled'], // Status can be 'pending', 'completed', or 'cancelled'
        default: 'pending'
    },
},
{
    timestamps: true  // Automatically create 'createdAt' and 'updatedAt' fields
})

// Creating the Transaction model from the transaction schema
const Transaction = mongoose.model("Transactions", transactionSchema);

export default Transaction;