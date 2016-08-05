var express = require('express');
var session = require('express-session');
var http = require('http');
var db = require('../database/setting');
var segment = require('../segment/setting');
var router = express.Router();
var sleep = require('../build/Release/hello.node').sleep;
var core = require('../core/manage.js');


/* GET home page. */

router.get('/', function (req, res, next) {
    console.log('call get /chat');
    
    
    //console.log('user 1:'+req.session.user);
    if(req.query.user){
        req.session.user = req.query.user
        //console.log('user 2:'+req.session.user);
    }
    if(req.session.user){
        //console.log('user 3:'+req.session.user);
        if (!req.session.cid) {
            core.startMengmengActive();
            core.requestnewcid(req.session.user,function(cid){
                console.log('new cid:'+cid)
                req.session.cid = cid;
                req.session.mid = 0;
                sendResponse(req,res);
            });
        }else{
            console.log('old cid:'+req.session.cid);
            sendResponse(req,res);
        }

        /*
        switch(req.query.deviceType){
            case "1":
                console.log("deviceType 1");
                res.send({ 'status': 'Succeed' });
                break;
            default:
                console.log("deviceType other");
                res.render('chat', { title: titlev });
        }*/

    } else {
        //console.log('user 4:'+req.session.user);
        switch(req.query.deviceType){
            case "1":
                console.log("deviceType 1");
                res.send({ 'status': 'Failed' });
                break;
            default:
                req.session.error = "请先登录"
                req.session.r = '/chat';
                res.redirect("login"); //未在url里加入user参数则重定向到 /login 路径
        }             
    }

});

var sendResponse = function(req,res){
    var titlev = "欢迎 " + req.session.user;
    switch(req.query.deviceType){
        case "1":
            console.log("deviceType 1");
            res.send({ 'status': 'Succeed' });
            break;
        default:
            console.log("deviceType other");
            res.render('chat', { title: titlev });
    }
};

//自动聊天
router.post('/sendMsg', function (req, res, next) {
    var msg = req.body.msg;
    var user = req.session.user;
    console.log('call chat/sendmsg user[' + user + ']: ' + msg);
    
    console.log('cid:' + req.session.cid + ' mid:' + req.session.mid);
    if(!user || !req.session.cid){
        res.send({ 'response': '请先登录' , 'status':'Failed'});
    }else{
        
        req.session.mid++;
        var msgDetail = {
                        cid:req.session.cid,
                        mid:req.session.mid,
                        msg:msg,
                        fromWho:user,
                        toWho:"system",
                        res:res,
                        req:req
                    };
        core.saveMsgToDb(msgDetail);
        
        sleep(1000);
        
        core.sendMsgToSystem(msgDetail, req, res);

    }
    
    //choose a better answers
    
    //send back
    
    //res.send({ 'response': '你好，我是小鸡机器人' });
});

router.post('/sendCmd', function (req, res, next) {
    var cmd = req.body.cmd;
    var user = req.session.user;
    console.log('call chat/sendCmd user[' + user + ']: ' + cmd);
    
    console.log('cid:' + req.session.cid + ' mid:' + req.session.mid);
    if(!user || !req.session.cid){
        res.send({ 'response': '请先登录' , 'status':'Failed'});
    }else{
        
        //req.session.mid++;
        
        var msgDetail = {
                        cid:req.session.cid,
                        mid:req.session.mid,
                        msg:cmd,
                        fromWho:user,
                        toWho:"system",
                        res:res,
                        req:req
                    };
        
        //core.saveMsgToDb(msgDetail);
        
        sleep(100);
        
        core.sendCmdToSystem(msgDetail, req, res);

    }
    
    //choose a better answers
    
    //send back
    
    //res.send({ 'response': '你好，我是小鸡机器人' });
});


module.exports = router;
