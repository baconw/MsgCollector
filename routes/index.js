var express = require('express');
var http = require('http');
var db = require('../database/setting');
var router = express.Router();


function startActive(){
  var data = {
        channelid: "2101",
        imei: "e7135315e42683dc35c753e8581b95e5",
        version: "3.2"
    };
    
  data = require('querystring').stringify(data);
  
  var opt = {
                method: "POST",
                host:'m.mengbaotao.com',
                port:'80',
                path:'/api.php?cmd=startActive',
                headers:{
                'Content-Type':'application/x-www-form-urlencoded; charset=utf-8',
                "Content-Length": data.length,
                'User-Agent':'èå¤©ç«æäºº 3.2 rv:3.2.1 (iPhone; iPhone OS 9.0.2; zh_CN)'
                }
          };
          
  var req = http.request(opt, function (serverFeedback) {  
        if (serverFeedback.statusCode == 200) {  
            var body = "";  
            serverFeedback.on('data', function (data) { body += data; })  
                          .on('end', function () { console.log('response:'+body); });  
        }  
        else {  
            console.log("error");  
        }  
    });  
    req.write(data + "\n");  
    req.end();
    
    // 载入模块
var Segment = require('segment');
// 创建实例
var segment = new Segment();
// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault();

// 开始分词
console.log(segment.doSegment('这是一个基于Node.js的中文分词模块。'));
};

function sendMsgToTuling(msg,fromWho,baseres){
  var msgDetail = {"msg":msg,
                    "fromWho":fromWho,
                    "toWho":"tuling"};
  //console.log('save1');
  saveMsgToDb(msgDetail);
                            
  var data = {
        "key":"282cd5374f914f40a101e86e90f0b7c6",
        "info": msg,
        "userid": fromWho
    };
    
  var bodyString = JSON.stringify(data);
  var opt = {
                method: 'POST',
                host:'www.tuling123.com',
                port:'80',
                path:'/openapi/api'
          };
          
  var req = http.request(opt, function (serverFeedback) { 
      //console.log('tuling return code:'+serverFeedback.statusCode);
       
        if (serverFeedback.statusCode == 200) {  
            var body = "";  
            serverFeedback.on('data', function (data) { body += data; })  
                          .on('end', function () { 
                            //console.log('response:'+body);
                            var jsonObj = JSON.parse(body);
                            var responseMsg = jsonObj.text;
                            //console.log('response:'+responseMsg);
                            var msgDetail = {"msg":responseMsg,
                                            "fromWho":"tuling",
                                            "toWho":fromWho};
                            //console.log('save2');
                            saveMsgToDb(msgDetail);
                            if(jsonObj.code == 100000 && jsonObj.text != msg){
                                if(fromWho=="mengmeng"){
                                    console.log('tuling said:'+responseMsg);
                                    sendMsgToMengMeng(responseMsg,"tuling",baseres);
                                }else{
                                    baseres.send({'response':responseMsg});
                                }
                            }else{
                                baseres.send({'response':responseMsg});
                            }
                        }).on('error',function(err){
                          console.log('error:'+err);
                          
                        });  
        }
        else {  
            console.log("error");  
        } 
        
    });  
    req.write(bodyString + "\n");
    //req.write(bodyString);  
    req.end();
};

function sendMsgToMengMeng(msg,fromWho,baseres){
  var msgDetail = {"msg":msg,
                   "fromWho":fromWho,
                   "toWho":"mengmeng"};
  //saveMsgToDb(msgDetail);
                            
  var data = {
        msg: msg,
        channelid: "2101",
        openid: "e7135315e42683dc35c753e8581b95e5",
        version: "3.2"
    };
    
  data = require('querystring').stringify(data);
  
  var opt = {
                method: "POST",
                host:'m.mengbaotao.com',
                port:'80',
                path:'/api.php?cmd=chatCallback',
                headers:{
                'Content-Type':'application/x-www-form-urlencoded; charset=utf-8',
                "Content-Length": data.length,
                'User-Agent':'èå¤©ç«æäºº 3.2 rv:3.2.1 (iPhone; iPhone OS 9.0.2; zh_CN)'
                }
          };
          
  var req = http.request(opt, function (serverFeedback) {  
        if (serverFeedback.statusCode == 200) {  
            var body = "";  
            serverFeedback.on('data', function (data) { body += data; })  
                          .on('end', function () { 
                            //console.log('tuling response:'+body);
                            var jsonObj = JSON.parse(body);
                            var responseMsg = jsonObj.ret_message;
                            if(responseMsg.substring(0,1)=='/'){
                                responseMsg = translateMengmengEmotion(responseMsg);
                            }
                            //console.log('response:'+responseMsg);
                            var msgDetail = {"msg":responseMsg,
                                            "fromWho":"mengmeng",
                                            "toWho":fromWho};
                            //saveMsgToDb(msgDetail);
                            if(fromWho=="tuling"){
                                console.log('mengmeng said:'+responseMsg);
                                sendMsgToTuling(responseMsg,"mengmeng",baseres);
                            }else{
                                baseres.send({'response':responseMsg});
                            }
                        }).on('error',function(err){
                          console.log('error:'+err);
                          
                        });  
        }
        else {  
            console.log("error");  
        }  
    });  
    req.write(data + "\n");  
    req.end();
};

function translateMengmengEmotion(input){
    console.log('call translateMengmengEmotion');
    var output = '';
    if(input=='/:hug'){
        output = '抱抱';
    }
    return output;
}

function save(values){
    //var values = [cid, msgDetail.msg, msgDetail.fromWho, msgDetail.toWho];
    db.query('INSERT INTO cattiebot.msgcollector SET conversationId = ?, msg = ? , fromWho = ? , toWho = ? ', values, 
          function(error, results) { 
              if(error) { 
                  console.log("Save db Error: " + error.message); 
              } else {
                  console.log("Save db Success"); 
              }
          } 
      );
}

function saveMsgToDb(msgDetail){
  var cid;
  db.query('SELECT max(conversationId) as cid from cattiebot.msgcollector;', function(err, rows, fields) {
    cid = rows[0].cid;
    if(cid==null){
      //console.log('cid is null');
      cid = 1;
      var values = [cid, msgDetail.msg, msgDetail.fromWho, msgDetail.toWho];
      save(values);
    }else{
      //console.log('cid is:' + cid);
      //if current time - last time > 1 minute, then cid++
      db.query('select current_timestamp() - time as gap from cattiebot.msgcollector where id = (select max(id) from cattiebot.msgcollector);',function(err, rows, fields){
          var timegap = rows[0].gap;
          console.log('timegap:'+timegap);
          if(rows[0].gap > 60){//60 is 1 minute
              cid=cid+1;
          }
          var values = [cid, msgDetail.msg, msgDetail.fromWho, msgDetail.toWho];
          save(values);
      })
    }
  });
};

/* GET home page. */
router.get('/', function(req, res, next) {
  startActive();
  res.render('index', { title: 'Express' });
});

router.get('/sendMsg',function(req,res,next){   //search 
    var msg = req.query.msg;
    console.log('call sendmsg:'+msg);
    var user = "mengmeng";
    sendMsgToTuling(msg,user,res);
    //res.render('index', { title: 'Express' });
});

module.exports = router;
