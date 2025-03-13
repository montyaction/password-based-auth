// utils/validation.js

function validateUserData(userData) {
  const errors = [];

  if (!userData.first_name || typeof userData.first_name !== "string") {
    errors.push("First name is required and must be a string.");
  }

  if (!userData.last_name || typeof userData.last_name !== "string") {
    errors.push("Last name is required and must be a string.");
  }

  if (typeof userData.age !== "number" || userData.age < 0) {
    errors.push("Age is required and must be a non-negative number.");
  }

  if (
    !userData.email ||
    typeof userData.email !== "string" ||
    !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(userData.email)
  ) {
    errors.push("Email is required and must be a valid email address.");
  }

  if (!userData.password || typeof userData.password !== "string") {
    errors.push("Password is required and must be a string.");
  }

  if (errors.length > 0) {
    return { valid: false, errors: errors };
  }

  return { valid: true };
}

module.exports = { validateUserData };