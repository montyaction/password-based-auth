// controllers/authController.js
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateUserData } = require("../utils/validation");
const { v4: uuidv4 } = require("uuid");
const { transporter } = require("../config/email");

async function registerUserController(userData) {
  // Check if a user with the same email already exists
  const existingUser = await userModel.findUserByEmail(userData.email);
  if (existingUser)
    return {
      valid: false,
      message: "User with this email already exists.",
      insertedId: existingUser._id,
    };

  const verificationToken = uuidv4();

  const validation = validateUserData(userData);
  if (!validation.valid) return validation;

  const hashedPassword = await bcrypt.hash(
    userData.password,
    parseInt(process.env.BCRYPT_SALT_ROUNDS)
  );

  userData.password = hashedPassword;
  userData.role = userData.role || "user"; // Set default role if not provided
  userData.isVerified = userData.isVerified || false; // Set default isVerified if not provided
  userData.verificationToken = verificationToken;

  const result = userModel.createUser(userData);

  if ((await result).valid) {
    const verificationLink = `http://127.0.0.1:3000/verify-email?token=${verificationToken}`;

    let message = {
      to: userData.email,
      subject: "Verify your email address",
      html: `<p>Please click the following link to verify your email address: <a href="${verificationLink}">${verificationLink}</a></p>`,
    };

    await transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log("Error occured. " + err.message);
        return process.exit(1);
      }

      console.log("Email sent sucessfully! %s", info.messageId);
      // Preview only availabe when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    });

  }
  return result;
}

async function loginUserController(userData) {
  const user = await userModel.findUserByEmail(userData.email);
  if (!user) {
    return { valid: false, message: "User is not exits" };
  }
  const passwordMatch = await bcrypt.compare(userData.password, user.password);
  if (!passwordMatch) {
    return { valid: false, message: "Invalid username or password" };
  }

  let jwtAccessSecretKey = process.env.JWT_ACCESS_SECRET;
  let jwtRefreshSecretKey = process.env.JWT_REFRESH_SECRET;
  let data = {
    time: Date(),
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(data, jwtAccessSecretKey, { expiresIn: "8h" });  // Short lifespan
  const refreshToken = jwt.sign(data, jwtRefreshSecretKey, { expiresIn: "7d" });  // Longer lifespan

  return { valid: true, message: "Login successful!", accessToken: accessToken, refreshToken: refreshToken };
}

async function verifyEmailController(token) {
  const user = await userModel.findUserByVerificationToken(token);

  if (!user) {
    return {
      valid: false,
      message: 'Invalid verification token.',
    }
  }

  return await userModel.updateUser(user._id, { isVerified: true, verificationToken: null });
}

module.exports = { registerUserController, verifyEmailController, loginUserController };
