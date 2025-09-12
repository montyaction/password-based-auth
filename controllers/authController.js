// controllers/authController.js
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateUserData } = require("../utils/validation");
const { v4: uuidv4 } = require("uuid");
const { transporter } = require("../config/email");
const nodemailer = require("nodemailer");

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Registration result
 */
async function registerUserController(userData) {
  try {
    // Check if a user with the same email already exists
    const existingUser = await userModel.findUserByEmail(userData.email);
    if (existingUser) {
      return {
        valid: false,
        message: "User with this email already exists.",
      };
    }

    // Validate user data
    const validation = validateUserData(userData);
    if (!validation.valid) return validation;

    // Generate verification token
    const verificationToken = uuidv4();

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || 10);
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Prepare user data for creation
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      role: userData.role || "user",
      isVerified: false,
      verificationToken,
    };

    // Create user
    const result = await userModel.createUser(userToCreate);

    // Send verification email if user creation was successful
    if (result.valid) {
      const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

      let message = {
        from: process.env.EMAIL_FROM || 'auth@example.com',
        to: userData.email,
        subject: "Verify your email address",
        html: `<p>Please click the following link to verify your email address: <a href="${verificationLink}">${verificationLink}</a></p>`,
      };

      await transporter.sendMail(message);
    }

    return result;
  } catch (error) {
    console.error("Registration error:", error);
    return { valid: false, message: "Registration failed", error: error.message };
  }
}

/**
 * Login a user
 * @param {Object} userData - User login credentials
 * @returns {Object} Login result with tokens
 */
async function loginUserController(userData) {
  try {
    // Find user by email
    const user = await userModel.findUserByEmail(userData.email);
    if (!user) {
      return { valid: false, message: "Invalid email or password" };
    }

    // Check if user is verified
    if (!user.isVerified) {
      return { valid: false, message: "Please verify your email before logging in" };
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(userData.password, user.password);
    if (!passwordMatch) {
      return { valid: false, message: "Invalid email or password" };
    }

    // Generate tokens
    const tokenData = {
      userId: user._id,
      email: user.email,
      role: user.role,
      time: Date.now()
    };

    const accessToken = jwt.sign(
      tokenData,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "8h" }
    );

    const refreshToken = jwt.sign(
      tokenData,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return {
      valid: true,
      message: "Login successful!",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    };
  } catch (error) {
    console.error("Login error:", error);
    return { valid: false, message: "Login failed", error: error.message };
  }
}

/**
 * Verify a user's email
 * @param {String} token - Verification token
 * @returns {Object} Verification result
 */
async function verifyEmailController(token) {
  try {
    const user = await userModel.findUserByVerificationToken(token);

    if (!user) {
      return {
        valid: false,
        message: 'Invalid verification token.'
      };
    }

    return await userModel.updateUser(user._id, {
      isVerified: true,
      verificationToken: null
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return { valid: false, message: "Verification failed", error: error.message };
  }
}

/**
 * Refresh access token using refresh token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} New access token
 */
async function refreshTokenController(refreshToken) {
  try {
    if (!refreshToken) {
      return { valid: false, message: "Refresh token is required" };
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if user still exists
    const user = await userModel.findUserById(decoded.userId);
    if (!user) {
      return { valid: false, message: "User not found" };
    }

    // Generate new access token
    const tokenData = {
      userId: user._id,
      email: user.email,
      role: user.role,
      time: Date.now()
    };

    const accessToken = jwt.sign(
      tokenData,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "8h" }
    );

    return {
      valid: true,
      message: "Token refreshed successfully",
      accessToken
    };
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return { valid: false, message: "Invalid refresh token" };
    } else if (error.name === "TokenExpiredError") {
      return { valid: false, message: "Refresh token expired" };
    }

    console.error("Token refresh error:", error);
    return { valid: false, message: "Token refresh failed", error: error.message };
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  verifyEmailController,
  refreshTokenController
};
