var mysql      = require('mysql');

/*
var db_config = {
  host     : 'localhost',
  user     : 'root',
  password : 'Password05',
  database : 'cattiebot',
  port : '3306'
};

var connection;

function handleError (err) {
  if (err) {
    // 如果是连接断开，自动重新连接
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      connect();
    } else {
      console.error(err.stack || err);
    }
  }
}

// 连接数据库
function connect () {
  connection = mysql.createConnection(db_config);
  connection.connect(handleError);
  connection.on('error', handleError);
}

connect();
*/

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Password05',
  database : 'cattiebot'
});

connection.connect();

module.exports = connection;