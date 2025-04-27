# SecureURLShorter

This project is the backend application for a URL shortening service built using Node.js, Express, and MongoDB. It allows users to convert long URLs into short, shareable links with a focus on security and functionality.

## Features

*   **URL Shortening:** Convert long URLs into unique short codes.
*   **User Registration and Login:** Allow users to create accounts and log in to manage their URLs.
*   **Custom Shortcodes (Optional):** Allow users to specify their desired short codes (if available).
*   **Password Protection:** Restrict access to short URLs with a password.
*   **IP Restriction:** Allow access to short URLs only from specific IP addresses.
*   **Expiration Date:** Set short URLs to become invalid after a specific date.
*   **Click Tracking:** Record the number of times short URLs are clicked and log click details (date, IP address, user-agent).
*   **API Access:** Provide API endpoints for integration with other applications.

## Security Measures

This application implements several security measures:

*   **Password Hashing (bcrypt):** User passwords are securely hashed before storing.
*   **Authentication (JWT):** User sessions are managed using JSON Web Tokens.
*   **Rate Limiting:** Limits the number of requests to sensitive endpoints (like login and shorten) to prevent brute-force attacks.
*   **Helmet:** Sets various HTTP security headers (e.g., `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`) to protect against common web vulnerabilities like clickjacking and XSS.
*   **CORS (Cross-Origin Resource Sharing):** Controls which origins are allowed to access the API. Needs proper configuration for production environments.
*   **Mongo Sanitize:** Protects against NoSQL query injection attacks by sanitizing user-supplied data used in MongoDB queries.
*   **Google Safe Browsing Integration:** Checks submitted URLs against Google's list of potentially unsafe sites.
*   **Input Validation:** Validates the format of URLs and IP addresses on relevant endpoints.

## Setup

Follow the steps below to set up and run the project on your local machine:

### Requirements

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js) or [yarn](https://yarnpkg.com/)
*   [MongoDB](https://www.mongodb.com/try/download/community) database (Local or cloud-based MongoDB instance)
*   [Git](https://git-scm.com/)

### Steps

1.  **Clone the Project:**
    ```bash
    git clone <project-repo-url>
    cd url-shortener-backend
    ```
    *Replace `<project-repo-url>` with the actual repository URL.*

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
    *(Includes `helmet`, `cors`, `express-mongo-sanitize`, `bcryptjs`, `jsonwebtoken`, `express-validator`, `mongoose`, `shortid`, `axios`, etc.)*

3.  **Set Up Environment Variables:**
    Create a file named `.env` in the project root directory and fill in the following variables according to your configuration:

    ```dotenv
    NODE_ENV=development # or production
    PORT=5000          # Port the application will run on
    MONGO_URI=mongodb://localhost:27017/url_shortener # Your MongoDB connection string
    JWT_SECRET=your_jwt_secret_key_here              # A secure JWT secret key
    BASE_URL=http://localhost:5000                   # Base URL for the service (for short links)
    GOOGLE_SAFE_BROWSING_API_KEY=your_google_api_key_here # Your Google Safe Browsing API key (optional)
    ```
    *   `MONGO_URI`: Your connection string for a local or cloud (e.g., MongoDB Atlas) database.
    *   `JWT_SECRET`: Generate a secure, random key for user sessions.
    *   `BASE_URL`: The base address that will be prepended to the shortened URLs (usually your server's address).
    *   `GOOGLE_SAFE_BROWSING_API_KEY`: Add your API key here if you want to use the Google Safe Browsing feature. It can be left blank (the security check will be skipped in this case).

4.  **Start the Application:**
    *   **Development Mode (with nodemon for auto-restarts):**
        ```bash
        npm run dev
        ```
    *   **Production Mode:**
        ```bash
        npm start
        ```

    The application will start running by default at `http://localhost:5000`. Accessing the root URL in a browser will show the status page including security measures.

## API Endpoints (Examples)

*   `POST /api/users/register`: Register a new user.
*   `POST /api/users/login`: Log in a user.
*   `POST /api/url/shorten`: Shorten a new URL (Requires authentication).
*   `GET /:shortCode`: Redirect the short URL to the original URL.
*   `GET /api/url/stats/:shortCode`: View statistics for a short URL (Requires authentication, must be the owner).
*   `GET /api/url/myurls`: List URLs shortened by the logged-in user (Requires authentication).

## Cloud Deployment

This backend application can be deployed to various cloud platforms (e.g., Heroku, AWS Elastic Beanstalk, Google Cloud Run, Vercel, DigitalOcean App Platform). Deployment steps vary depending on the chosen platform but generally involve:

1.  Pushing the code to a Git repository.
2.  Creating an application on the cloud platform.
3.  Configuring environment variables (MONGO_URI, JWT_SECRET, BASE_URL, NODE_ENV=production, etc.) on the platform.
4.  Triggering the deployment process (often via Git push or the platform's interface).
5.  Updating the `BASE_URL` to the public address of the deployed application.
6.  **Important:** Configure CORS settings appropriately for your production frontend domain.

Refer to the documentation of your chosen cloud provider for detailed instructions. 
