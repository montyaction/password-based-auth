# RESTful API for User Management

This is a Node.js RESTful API for managing user data. It provides endpoints for user registration, authentication, email verification, and full CRUD (Create, Read, Update, Delete) operations on user resources.

## Features

- **User Authentication:** Secure, stateful authentication using JWT and cookies.
- **Email Verification:** New users must verify their email address to gain full access.
- **Comprehensive CRUD:** Endpoints to create, retrieve, update, and delete users.
- **Role-Based Authorization:** Secure endpoints to restrict access based on user roles (e.g., `admin`, `editor`).
- **Advanced Queries:** Support for searching, pagination, and sorting user data.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/montyaction/password-based-auth.git](https://github.com/montyaction/password-based-auth.git)
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the following:
    ```
    MONGO_URI=<Your MongoDB connection string>
    JWT_ACCESS_SECRET=<Your JWT access token secret>
    JWT_REFRESH_SECRET=<Your JWT refresh token secret>
    EMAIL_USER=<Your email address for sending emails>
    EMAIL_PASS=<Your email password/app-specific password>
    ```

## Usage

1.  **Start the server:**
    ```bash
    npm start
    ```
2.  The API will be running at `http://localhost:3000`.

## API Endpoints

| Endpoint                      | Method | Description                                                              |
| ----------------------------- | ------ | ------------------------------------------------------------------------ |
| `/auth/register`              | `POST`   | Creates a new user and sends a verification email.                     |
| `/auth/verify/:token`         | `GET`  | Verifies a user's email with a unique token.                               |
| `/users`                      | `GET`  | Retrieves a list of all users (admin/editor only).                         |
| `/users/:id`                  | `GET`  | Retrieves a single user by ID.                                             |
| `/users/:id`                  | `PUT`  | Updates a user's information.                                            |
| `/users/:id`                  | `DELETE` | Deletes a user by ID.                                                    |
| `/user/me`                    | `GET`  | Retrieves the currently authenticated user's profile.                    |

## Contributing

We welcome contributions! Please feel free to open a new issue or submit a pull request.