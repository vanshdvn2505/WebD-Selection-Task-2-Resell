# Reselling Marketplace Backend

This project provides the backend for a reselling marketplace where users (buyers and sellers) can sign up, list products, search for items, manage their shopping cart, and complete transactions. The backend is powered by Express.js, with MongoDB as the database. Features include authentication, product management, cart functionality, and real-time chat.

## 🛠️ Tech Stack

- **Backend Framework:** Express.js, TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT-based authentication
- **Caching and Message Broker:** Redis
- **Email Service:** Nodemailer
- **Web Sockets:** Socket.IO

## 🔐 Key Features

### 1. Secure Authentication

- **User Registration:** Users can register using `POST /auth/signUp`.
- **User Login:** Users authenticate via `POST /auth/signIn`.
- **Token-Based Authentication:** JWTs are used for secure login sessions.

### 2. Seller Capabilities

- **Product Listing:** List a new product for sale. `POST /seller/listProduct`.
- **Update Product:** Update an existing product by ID. `PATCH /seller/updateProduct/:id`.	
- **Delete Product:** Delete a product by ID. `DELETE /seller/deleteProduct/:id`.

### 3. Buyer Capabilities

- **Update Profile:** Update the user profile. `PATCH /user/updateProfile`.	
- **Fetch Products:** Fetch paginated product listings. `GET /user/getProducts/:page/:limit`.
- **Like Product:** Like or favorite a product. `POST /user/likeProduct/:id`.
- **Fetch Cart:** Retrieve the user's current cart. `GET /user/getCart`.
- **Add Items To Cart:** Add a product to the shopping cart. `POST /user/addToCart`.
- **Update Cart:** Update product quantities in the cart. `PATCH /user/updateCart`.
- **Remove Product From Cart:** Remove a product from the cart. `DELETE /user/removeFromCart/:prodId`.
- **Fetch Transactions:** Fetch the user's transaction history. `GET /user/getTransactions`.
- **Delete Transaction:** Delete a transaction by ID.. `DELETE /user/deleteTransactions/:id`.
- **Checkout:** Proceed to checkout. `POST /user/checkOut`.

### 4. Redis-Powered Functionalities

This project leverages Redis for efficient data management and real-time interactions. Redis is used for:

- **OTP Management:** Redis is utilized to store and manage OTP data. Each OTP is stored for 10 minutes
for verification and then deleted.
  
  - *Key Structure:* `otp:email`
  - *Value Structure:* A hash containing product IDs, quantities, and other relevant information.

- **Cart Management:** Redis is utilized to store and manage shopping cart data. Each user's cart is maintained in Redis with product information, quantities, and prices. This allows for fast access and updates.
  
  - *Key Structure:* `cart:userId:items` (Each user's cart is a unique key)
  - *Value Structure:* A hash containing product IDs, quantities, and other relevant information.


- **Review Management:** Redis is utilized to store and manage reviews of a product. This is stored for 15 minutes so that user can analyze a product with fast access to reviews.
  
  - *Key Structure:* `products:id:reviews`
  - *Value Structure:* A hash containing reviewer IDs, text, and ratings.

### 5. Reviewing System

- **Fetch Reviews:** Fetch reviews for a product. `GET /user/getReview/:id`.
- **Post Review:** Submit a review for a product. `POST /user/reviewProduct/:id`.

### 6. Search Mechanism

Find products easily with the search functionality:

- **Search Products:** Search for products based on criteria `GET /user/searchProducts`.

## 🔥 Real-Time Chat System

The platform supports real-time, one-to-one chat between buyers and sellers. This feature allows users to discuss product details, negotiate prices, and reach agreements quickly. The chat system is built using `Socket.IO` for WebSocket communication and `Redis` as a message broker to ensure scalability and efficient message delivery.

### Chat System Overview

- **WebSocket Communication:** The chat system uses WebSocket for real-time communication between users, enabling instant messaging.
- **Redis as Message Broker:** Redis is used to manage active chat sessions and message queues, ensuring message delivery even in cases of network interruptions.

### Key Features

- **Instant Messaging:** Users can send and receive messages in real time.
- **Message Persistence:** Messages are temporarily stored in Redis during active sessions and can be persisted to the database if needed for future reference.
- **Scalability:** Using Redis as a message broker allows the chat system to scale horizontally across multiple servers.

## 🚀 Setup and Installation

### Prerequisites

- Node.js
- MongoDB
- TypeScript
- Redis
- Email account for Nodemailer configuration

###  1. Steps For Setting Up The Server
- npm i (for installing dependencies)
- create a .env file and add  all environmental variales listed in .env.sample file
- in connectDb.ts fill the proxy details if needed
- npm run build (command for compiling TypeScript to JavaScript)
- npm run start (command for starting the server)

### 2. SignUp
- **Request Body:** <pre>`{
                                        "name": "John Doe",
                                        "email": "john.doe@example.com",
                                        "password": "securepassword",
                                        "role": "seller" || "buyer" (optional : buyer by default)
                                      }`</pre>
- **User SignUp:** Route - `POST /auth/signUp`
- After the above step you have to verify otp. After that user will be finally registered
- **Verify OTP:** Route - `POST /auth/verifyOtp` (You have to provide `otp` along with `response data` the above route has sent)
- If OTP is verified successfully User is registered.

### 3. SignIn
- **User SignIn:** Route - `POST /auth/signIn`
- These routes will check the user role and if it is matched you are signed in successfully.

### 4. Middlewares
- **isAuthorised:** Middleware to check that user is authorized.

## Submitted By:
- **Name**: Vansh Dhawan
- **Enrollment Number**: IIB2023033
