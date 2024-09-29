import mongoose from "mongoose";

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

cartSchema.pre('save', async function (next) {
    const cart = this;
    let total = 0;

    for (const item of cart.items) {
        const product = await mongoose.model('Products').findById(item.product);
        total += product.price * item.quantity;
    }

    cart.totalAmount = total;
    next();
});


const Cart = mongoose.model("Carts", cartSchema);

export default Cart;