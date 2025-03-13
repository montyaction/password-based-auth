const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const { validateUserData } = require('../utils/validation');

async function registerUser(userData) {
  let email = userData.email;
  let user = await userModel.findUserByEmail({ email })
  console.log(user);
    if (user) return {
        valid: true,
        message: "User already exists.",
        insertedId: user.insertedId
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
        return { valid: false, message: 'Invalid username or password' };
    }
    const passwordMatch = await bcrypt.compare(userData.password, user.password);
    if (!passwordMatch) {
      return { valid: false, message: "Invalid username or password" };
    }
    return { valid: true, message: 'Login successful!' };
}

module.exports = { registerUser, loginUser };