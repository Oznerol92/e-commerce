# E-commerce App

## Requirements

- [MongoDB local or cluster](https://www.mongodb.com/)

- [Node/npm](https://nodejs.org/)

- [Stripe account](https://stripe.com/): not needed in development if not checking out

## Install

- production

  `npm install`

- dev

  `npm run dev-install`

## Create uploads folder

`mkdir uploads`

## Edit .env Variables

- open .env_sample with any text editor

  - ex with nano

    `nano .env_sample`

- edit the file with your variables and change the name in .env

  - ex with nano

    change variables => CTRL+X => Y => delete \_sample => ENTER => Y

```
# Mongo db connection

MONGO_USERNAME='username'
MONGO_PASSWORD='password'
MONGO_HOSTNAME='hostname'
MONGO_DB_NAME='db_name'

# Session / Cookie

SESSION_SECRET='secret'
SESSION_NAME='session_name'

# Stripe
STRIPE_API_KEY='stripe_api_key'

# Port
PORT='your_port'

# Admin email
ADMIN_EMAIL='admin@email.com'
```

## Scripts

> **Make sure to run Mongo locally or to enter the right cluster credentials**

- run only if .env variables are production ready

  `npm start: run production`

- production test

  `npm test-prod`

- only frontend (this is not working right now => TODO: missing API comunication/dummy data)

  `npm run frontend`

- run only server (use it with insomnia/postman, TODO: give insomnia config)

  `npm run server`

- run concurrently server and frontend

  `npm run dev`

- build react for production

  `npm run build`

## Sign Up as Admin

- use the email you entered in .env to sign up with any password you want

# TODO

- [] re write React app folder structure

  ```
    src/
    |-- apiCalls/
    |   |-- api.js                  # Contains functions for making custom API calls (e.g., to localhost:5000/api)
    |-- assets/
    |   |-- images/                 # Store image files
    |   |-- files/                  # Store other types of files (e.g., PDFs, documents)
    |   |-- videos/                 # Store video files
    |-- components/
    |   |-- Modals                  # Reusable header component
    |   |-- Buttons                 # Reusable footer component
    |   |-- ...                     # Other reusable components (Logo, ...)
    |-- layout/
    |   |-- Header                  # Reusable header component
    |   |-- Footer                  # Reusable footer component
    |-- pages/
    |   |-- Home                    # Page component for the home page
    |   |-- AboutUs                 # Page component for the about page
    |   |-- ContactUs               # Page component for the contact page
    |   |-- ...                     # Other page components
    |-- App.js                      # The main application component
    |-- index.js                    # Entry point for your React app
    |-- App.css                     # Global styles for the app
    |-- ...
  ```

  - apiCalls/: This directory contains modules for making API calls to your custom API. It helps keep your API-related logic organized and separate from your components.

  - assets/: This directory is used to store static assets such as images, files, and videos that your application may need. Keeping them here makes it easier to manage and reference these assets in your code.

  - components/: This directory holds reusable components that can be used across different pages and layouts in your application. Examples include Header, Footer, Buttons, and Input components.

  - layout/: Layout components define the overall structure of your app, such as the main layout that wraps your pages. You can have multiple layout components if your app has different layouts for different sections.

  - pages/: Page components represent different views or pages of your application. Each page component typically corresponds to a specific route or URL. Examples include Home, About, Contact, and other pages specific to your app.

  - App.js: This is the main application component where you set up routing, global state management, and the overall structure of your app.

    ```jsx
    import { Outlet } from "react-router-dom";
    import Header from "./layout/Header/Header";
    import Footer from "./layout/Footer/Footer";

    import "./app.css";

    function App() {
      return (
        <>
          <div className="background-image" />
          {/* <PopUp /> */}
          <Header />
          <div className="content">
            <Outlet />
          </div>
          <Footer />
        </>
      );
    }

    export default App;
    ```

  - index.js: The entry point of your React application, where you render the App component and mount it to the DOM.

    ```jsx
    import React from "react";
    import ReactDOM from "react-dom/client";
    import "./index.css";
    import ContactUs from "./pages/ContactUs.jsx/ContactUs";
    import AboutUs from "./pages/AboutUs/AboutUs";
    import { createBrowserRouter, RouterProvider } from "react-router-dom";
    import ErrorPage from "./layout/ErrorPage/ErrorPage";
    import App from "./App";
    import Home from "./pages/Home/Home";
    import Admin from "./pages/Admin/Admin";
    import SignIn from "./pages/Auth/SignIn";
    import SignUp from "./pages/Auth/SignUp";

    const router = createBrowserRouter([
      {
        path: "/",
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
          {
            path: "/contact-us",
            element: <ContactUs />,
          },
          {
            path: "/about-us",
            element: <AboutUs />,
          },
          {
            path: "/admin",
            element: <Admin />,
          },
          {
            path: "/sign-in",
            element: <SignIn />,
          },
          {
            path: "/sign-up",
            element: <SignUp />,
          },
        ],
      },
    ]);

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    );
    ```

  - App.css: Global styles for your app that can be shared across components.

- [] re write backend folder structure

  ```
    e-commerce/
    |-- bin/
    |-- config/
    |   |-- db.js                       # Database configuration
    |-- controllers/                    # API Controllers
    |-- middleware/                     # Middlewares
    |-- models/                         # Mongoose schema
    |-- public/                         # React app
    |-- routes/                         # API routes
    |   |-- api/
    |   |   |-- v1/
    |   |   |   |-- auth.js             # API routes for authentication
    |   |   |   |-- payments.js         # API routes for payments
    |   |   |-- index.js                # API routes entry point
    |-- services/                       # Services
    |-- utils/                          # Utilities
    |-- .env_sample                     # Sample environment variables file
    |-- app.js                          # Express.js application setup
    |-- package.json                    # Dependencies and scripts
    |-- README.md                       # Project documentation
    |-- ...
  ```

  - controllers/paymentController.js

  ```javascript
    const createPaymentIntentController = async () {
        // If stripe
        stripeCreatePaymentIntent()
        // If Paypal

        // If crypto

        // ...
  }
  ```

  - services/stripePaymentService.js

  ```javascript
    const stripeCreatePaymentIntent = async () {
        try {
            let user;
            if (req.session && req.session.passport && req.session.passport.user) {
            user = await User.findById(req.session.passport.user);
            }
            const { amount, currency, paymentMethod, customer } = req.body;

            const payment_intent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method: paymentMethod,
            customer,
            });

            if (user) {
            const existingPaymentIntent = user.payment_intents.find(
                (intent) => intent.id === payment_intent.id
            );
            if (existingPaymentIntent) {
                return res.json({ error: "Payment intent already exists" });
            }

            user.payment_intents.push(payment_intent);

            await user.save();
            }

            res.json({ payment_intent });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
  }
  ```

  - routes/api/v1/payments.js

  ```javascript
  router.post("/create-payment-intent", createPaymentIntentController);
  ```

- [] move all old code into new files

## **How to contribute?**

**1. Fork the Project**

- Create your Branch

  - New Feature (`git checkout -b feature/AmazingFeature`)
  - Bug Fix (`git checkout -b bugfix/SomethingToFix`)

- Commit your Changes (`git commit -m 'Add some AmazingFeature'` or `git commit -m 'Fix SomethingToFix'`)

- Push to the Branch (`git push origin feature/AmazingFeature` or `git checkout -b bugfix/SomethingToFix`)

- Open a Pull Request

**2. Work on an existing branch**

- Update all the branches (`git fetch --all`)

- Checkout to that branch (`git checkout branch_name`)

- Update to the latest (`git pull`)

- **contact the dev to see what's the best way to work together**
