const crypto = require("crypto");
const secretKey = crypto.randomBytes(32); // Raw 32-byte buffer
console.log("Secret Key:", secretKey.toString("hex")); // Optional: Log the hex version for reference