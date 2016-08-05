var express = require('express');
var session = require('express-session');
var http = require('http');
var db = require('../database/setting');
var segment = require('../segment/setting');
var router = express.Router();
var sleep = require('../build/Release/hello.node').sleep;
var MAX_KEY_WORD = 3;
var core = require('../core/manage.js');

function markDuplicate(baseres) {

}

function displayMengMengResponse(msgDetail){
    console.log('mengmeng said:' + msgDetail.msg);
    msgDetail.mid++;
    msgDetail.fromWho = "mengmeng";
    msgDetail.toWho = "tuling";
    core.saveMsgToDb(msgDetail);
    sleep(2000);
    if(msgDetail.mid<100){
        core.sendMsgToTuling(msgDetail, displayTulingResponse);
    }
}

function displayTulingResponse(msgDetail){
    console.log('tuling said:' + msgDetail.msg);
    msgDetail.mid++;
    msgDetail.fromWho = "tuling";
    msgDetail.toWho = "mengmeng";
    core.saveMsgToDb(msgDetail);
    sleep(2000);
    if(msgDetail.mid<100){
        core.sendMsgToMengMeng(msgDetail, displayMengMengResponse);
    }
}

/* GET home page. */
router.get('/', function (req, res, next) {
    console.log('call get /');
    if (!req.session.user) {                     //到达/home路径首先判断是否已经登录
        req.session.error = "请先登录"
        res.redirect("/login");                //未登录则重定向到 /login 路径
    }
    else {
        var titlev;
        if (req.session.isVisit) {
            req.session.isVisit++;
            titlev = '第 ' + req.session.isVisit + '次来此页面';
        } else {
            req.session.isVisit = 1;
            titlev = "欢迎第一次来这里";
            console.log(req.session);
        }
        res.render('index', { title: titlev });
    }
});


//自动聊天
router.get('/sendMsg', function (req, res, next) {
    var msg = req.query.msg;
    console.log('call sendmsg:' + msg);
    var user = "user";
    
    core.requestnewcid(user,function(result){
        var msgDetail = {
            cid:result,
            mid:1,
            msg:msg,
            fromWho:user,
            toWho:"mengmeng"
        };
        core.saveMsgToDb(msgDetail);
        //sendMsgToTuling(cid, mid, msg, user, res);
        core.sendMsgToMengMeng(msgDetail, displayMengMengResponse);
        res.send({ 'response': '开始自动聊天' });
    });
});

module.exports = router;
