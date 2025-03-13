const authController = require("../controllers/authController");

async function handleRegister(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", async () => {
    try {
      const parsedBody = JSON.parse(body);
      const result = await authController.registerUser(parsedBody);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Data received", body: parsedBody, resData: result }));
    } catch (error) {
      console.log("Received body (non-JSON):", body);
      console.error(error);

      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(`Received body: ${body}`);
    }
  });
}

async function handleLogin(req, res) {
    let body = '';
    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', async () => {
      try {
        const parsedBody = JSON.parse(body);
        const result = await authController.loginUser(parsedBody);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ valid: false, message: "Invalid request" }));
      }
    });
}

module.exports = { handleRegister, handleLogin };
