var express = require('express');
var session = require('express-session');
var router = express.Router();
var db = require('../database/setting');

/* GET login page. */
router.route("/").get(function (req, res) {    // 到达此路径则渲染login文件，并传出title值供 login.html使用
    console.log('call /login');
    res.render("login", { title: 'User Login' });
}).post(function (req, res) {                        // 从此路径检测到post方式则进行post数据的处理操作
    console.log('call /login post');
    //get User info
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    //var User = global.dbHandel.getModel('user');  
    var uname = req.body.uname;                //获取post上来的 data数据中 uname的值
    var upwd = req.body.upwd;
    console.log('uname:' + uname + ' upwd:' + upwd);
    var values = [uname];
    db.query('select uname,upwd from cattiebot.user where uname = ?', values, function (err, rows) {
        //console.log('fields:'+JSON.stringify(fields));
        if (err) {
            res.send(500);
            console.log(err);
        } else if (rows.length == 0) {
            console.log('uname not found');
            req.session.error = '用户名不存在';
            res.send(404);                            //    状态码返回404
            //res.redirect("/login");
        } else {
            if (upwd != rows[0].upwd) {
                console.log('wrong password');
                req.session.error = "密码错误";
                res.send(404);
                //res.redirect("/login");
            } else {
                console.log('login success');
                req.session.user = rows[0].uname;
                if(req.session.r){
                    var r = req.session.r;
                    req.session.r = null;
                    console.log('call redirect to: ' + r);
                    res.send({"r":r});
                }else{
                    res.send(200);
                }
                
            }
        }
    });
});

module.exports = router;