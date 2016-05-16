var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Password05',
  database : 'cattiebot',
  port : '3306'
});

module.exports = connection;