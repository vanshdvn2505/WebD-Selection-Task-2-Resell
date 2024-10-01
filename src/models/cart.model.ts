import mongoose from "mongoose";

// Defining the cart schema for MongoDB
const cartSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },

    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
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
        default: 0
    },
},
{
    timestamps: true
})


// Pre-save middleware to calculate the total amount before saving the cart
cartSchema.pre('save', async function (next) {
    const cart = this;
    let total = 0;

    await cart.populate({
        path: 'items.product',
        populate: {path: 'seller', model: 'Users'}
    });

    // Calculate the total amount based on product prices and quantities
    for(const item of cart.items){
        const product = await mongoose.model('Products').findById(item.product);
        total += product.price * item.quantity;
    }

    cart.totalAmount = total;
    next();
});

// Creating the Cart model from the cart schema
const Cart = mongoose.model("Carts", cartSchema);

export default Cart;