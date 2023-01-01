const dotenv = require('dotenv');
const mysql = require('mysql');

// configure with env.
dotenv.config({ path: __dirname + '/config.env' });

var dbConnection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USERNAME || 'app',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'oxygen',
  charset: 'utf8mb4'
})

dbConnection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = dbConnection;
