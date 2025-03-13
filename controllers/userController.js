const userModel = require("../models/userModel");

async function getAllUsers() {
    return userModel.getAllUsers();
}

async function getUserByEmailId(email) {
    return userModel.findUserByEmail(email);
}

module.exports = { getAllUsers, getUserByEmailId };