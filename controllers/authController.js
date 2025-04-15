// controllers/authController.js
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validateUserData } = require('../utils/validation');

async function registerUser(userData) {
  // Check if a user with the same email already exists
  const existingUser = await userModel.findUserByEmail(userData.email)
    if (existingUser) return {
        valid: false,
        message: "User with this email already exists.",
        insertedId: existingUser._id
    }

  const validation = validateUserData(userData);
  if (!validation.valid) return validation;
  
  const hashedPassword = await bcrypt.hash(
    userData.password,
    parseInt(process.env.BCRYPT_SALT_ROUNDS)
  );
  userData.password = hashedPassword;
  return userModel.createUser(userData);
}

async function loginUser(userData) {
  const user = await userModel.findUserByEmail(userData.email);
  if (!user) {
    return { valid: false, message: 'User is not exits' };
  }
  const passwordMatch = await bcrypt.compare(userData.password, user.password);
  if (!passwordMatch) {
    return { valid: false, message: "Invalid username or password" };
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
  return { valid: true, message: 'Login successful!', token: token };
}

module.exports = { registerUser, loginUser };