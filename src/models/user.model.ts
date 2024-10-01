import mongoose from "mongoose";


// Defining the user schema for MongoDB
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['buyer', 'seller'],
        default: 'buyer'
    },

    contact: {
        type: String,
        requried: false,
        default: ""
    },

    location: {
        type: String,
        required: false,
        default: ""
    },

    transactonHistory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transactions'
    },

    likedItems: {
        type: [String],
        defalut: []
    }
})

// Creating the User model from the user schema
const User = mongoose.model("Users", userSchema);

export default User;