# Organive - Multivendor Store

Organive is a real-world, multivendor store project developed to learn and implement advanced concepts in web development. This Node.js project leverages various technologies and APIs to create a seamless e-commerce experience.

## Technologies Used

- **Node.js**: The project is built using Node.js, which allows for efficient server-side JavaScript development.

- **Express**: Express is the web application framework used to create a robust and scalable backend for the project.

- **MongoDB with Mongoose**: We use MongoDB as our database system, and Mongoose as the ODM (Object Data Modeling) library to interact with the database.

- **EJS Template Engine**: EJS (Embedded JavaScript) is used to render dynamic web pages and display data from the server.

- **Multer**: Multer is employed for handling file uploads.

- **Passport for Google OAuth**: We have implemented Google OAuth for user authentication, allowing users to log in with their Google accounts.

- **JSON Web Tokens (JWT) and Bcrypt**: JWT is used for user session management and authentication.

- **Bcrypt**: Bcrypt is used to securely hashing user passwords before storing in DB.

- **Razorpay and Stripe**: Payment gateways are integrated, enabling users to make secure transactions through both Razorpay and Stripe.

- **Google Maps APIs**: Google Maps APIs are used for address autocomplete, making it easier for users to enter their addresses and also give us latitude and longitude.

- **SendGrid**: SendGrid is used for sending email to users, such as order confirmations and reset password links.

## Project Flow

Organive consists of three main user roles and various functionalities:

1. **Shop (User) Side:**
   - Users can browse and select stores based on the vendor's location and delivery range.
   - Users can add products to their wishlist or shopping cart.
   - The checkout process is available to complete purchases.
   - User authentication is possible through Google OAuth or by registering with an email and password.
   - The user dashboard allows viewing and updating profiles, changing passwords, logging out, viewing orders, and canceling them.
   - Promocodes can be applied during checkout.

2. **Admin Panel:**
   - Admins can create and manage vendors or allow vendors to register via the vendor panel.
   - Admins can create categories for products.
   - The creation of promocodes for user discounts is available.
   - Admins can view vendors and manage products, including product deletion.

3. **Vendor Panel:**
   - Vendors can register or log in.
   - Vendors can create, manage, and delete their products.
   - Order management, including order acceptance or rejection, is possible.

## Getting Started

To set up the Organive project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/NikhilMandaliya/Organive.git
   ```
   
2. Install dependencies:

   ```bash
   cd organive
   npm install
   ```

3. Configure environment variables:

- Create a .env file in the project root and add the necessary environment variables, such as API keys and secrets for MongoDB, Google OAuth, SendGrid, and payment gateways.

4. Start the application:

   ```bash
   npm start
   ```

5. Access the project in your web browser at http://localhost:3000.
   
<h3 align="center">Happy coding!</h3>
