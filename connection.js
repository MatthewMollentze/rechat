const dotenv = require('dotenv');
const mysql = require('mysql');

// configure with env.
dotenv.config();
var dbConnection = mysql.createConnection({
  host: "localhost",
  user: "app",
  password: "password",
  database: "oxygen",
  charset: 'utf8mb4'
});

dbConnection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = dbConnection;
