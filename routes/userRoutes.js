const {
  getAllUsers,
  getUserByEmailId,
} = require("../controllers/userController");
const { deleteUsers, deleteUserByQuery, deleteUserById } = require("../models/userModel");
const url = require('url');

async function handleGetAllUsers(req, res) {
  try {
    const users = await getAllUsers();

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(users));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}

async function handleGetUserByEmail(req, res) {
  const email = "khushikanwar@gmail.com";
  try {
    const user = await getUserByEmailId(email);
    console.log("🐞 User data is here: ", user);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(user));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}

async function handleDeleteUsers(req, res) {
  try {
    const result = await deleteUsers();

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}

async function handleDeleteUser(req, res) {
    const userId = req.url.split('/').pop();
    console.log(userId);
    try {
        const result = await deleteUserById(userId);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
    } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function handleDeleteUsersByQuery(req, res) {
      try {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        
        // if (query.age) {
        //     query.age = parseInt(query.age);
        // }
        console.log(query);

          const result = await deleteUserByQuery(query);
          
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        } catch (error) {
            console.error(error);
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid query" }));
        }
}

module.exports = { handleGetAllUsers, handleGetUserByEmail, handleDeleteUser, handleDeleteUsers, handleDeleteUsersByQuery };
