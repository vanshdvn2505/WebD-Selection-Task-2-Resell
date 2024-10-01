// import mongoose from "mongoose";

// // Defining the notification schema for MongoDB
// const notificationSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//     },
//     message: {
//         type: String,
//         required: true,
//     },
//     isRead: {
//         type: Boolean,
//         default: false,
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
// });

// // Creating the Notification model from the notification schema
// const Notification = mongoose.model("Notifications", notificationSchema);

// export default Notification;