var express = require('express');
var http = require('http');
var db = require('../database/setting');
var router = express.Router();
var core = require('../core/manage.js');

router.get('/', function(req, res, next) {
    console.log('call /manage');
    
    db.query('SELECT count(*) as c from cattiebot.msgcollector', function(err, rows, fields) {
        var msgCount = 0;
        var msgCount2 = 0;
        if(err){
            console.log('error:' + err);
        }else{
            msgCount = rows[0].c;
            var querystr = 'SELECT count(*) as c FROM cattiebot.msgcollector a where  (a.isGoodAnswer is null or (a.isGoodAnswer is not null and (select b.isGoodAnswer from cattiebot.msgcollector b where a.msgid=b.msgid+1 and a.conversationid=b.conversationid) is null))';
            db.query(querystr, function(err, rows, fields) {
                if(err){
                    console.log('error:' + err);
                }else{
                    msgCount2 = rows[0].c;
                }
                console.log('msgCount:' + msgCount + ' msgCount2:' + msgCount2);
                res.render('manage', {'msgCount':msgCount,'msgCount2':msgCount2});
            });
        }
        
    });
    
    //segment.useDefault();
    //segment.loadDict('user.txt');
    /*
    var msg = '图灵机器人您真聪慧，给我买辆老死赖死！';
    core.splitSentence(msg);
    msg = '哄我开心';
    core.splitSentence(msg);
    msg = '何时去山大';
    core.splitSentence(msg);
    */
    //TODO 有些同义词不能转换的？载入自定义词典有没有成功？
    
    //res.render('manage', {'msgCount':0});
});

router.get('/msglistall', function(req, res, next) {
    console.log('call /manage/msglistall pageSize:' + req.query.pageSize + ' pageNumber:' + req.query.pageNumber);
    var pageSize = parseInt(req.query.pageSize);
    var pageNumber = parseInt(req.query.pageNumber);
    //var pageSize = 20;
    //var pageNumber = 1;
    var values = [(pageNumber-1)*pageSize,pageSize];
    db.query('SELECT conversationId,msgId, msg,isGoodAnswer from cattiebot.msgcollector limit ?,?',values, function(err, rows, fields) {
        var msgListValue = new Array();
        if(err){
            msgListValue.push('error:'+err);
        }else{
            var rowLength = rows.length;
            //var rowLength = 20;
            for(var i = 0;i<rowLength;i++){
                msgListValue.push(rows[i].conversationId + ':' + rows[i].msgId + ':' + rows[i].msg + ':' + rows[i].isGoodAnswer);
            }
        }
        res.send( { msgList: msgListValue } );
    });
});

router.get('/msglist', function(req, res, next) {
    console.log('call /manage/msglist pageSize:' + req.query.pageSize + ' pageNumber:' + req.query.pageNumber);
    var pageSize = parseInt(req.query.pageSize);
    var pageNumber = parseInt(req.query.pageNumber);
    //var pageSize = 20;
    //var pageNumber = 1;
    var values = [(pageNumber-1)*pageSize,pageSize];
    var querystr = 'SELECT conversationId,msgId, msg,isGoodAnswer FROM cattiebot.msgcollector a where  (a.isGoodAnswer is null or (a.isGoodAnswer is not null and (select b.isGoodAnswer from cattiebot.msgcollector b where a.msgid=b.msgid+1 and a.conversationid=b.conversationid) is null)) limit ?,?';
    db.query(querystr,values, function(err, rows, fields) {
        var msgListValue = new Array();
        if(err){
            msgListValue.push('error:'+err);
        }else{
            var rowLength = rows.length;
            //var rowLength = 20;
            for(var i = 0;i<rowLength;i++){
                msgListValue.push(rows[i].conversationId + ':' + rows[i].msgId + ':' + rows[i].msg + ':' + rows[i].isGoodAnswer);
            }
        }
        res.send( { msgList: msgListValue } );
    });
});

router.post('/audit', function(req, res, next){
    console.log('call /manage/audit:' + req.body.cid + ',' + req.body.mid);
    var answercid = req.body.cid;
    var answermid = req.body.mid;
    var values = [req.body.isGood,'wpd',answercid,answermid];//todo update function results
    db.query('update cattiebot.msgcollector set isGoodAnswer = ?, auditBy = ?, auditTime = current_timestamp() where conversationId = ? and msgId = ?',values, function(err, rows, fields) {
        if(err){
            console.log('step 1, update msgcollector failed.');
            res.send({'response':'error'});
        }else{
            console.log('step 1, update msgcollector success.');
            if(req.body.isGood == 'Y'){
                //update or insert askanswer
                values = [answercid, answermid-1, answermid];
                db.query('select conversationId, msgId, msg from cattiebot.msgcollector where conversationId = ? and msgId in (?, ?)',values,function(err,rows,fields){
                    if(err){
                        console.log('step 2, search for ask and answer message failed');
                        res.send({'response':'error'});
                    }else{
                        if(rows.length == 2){
                            console.log('step 2, ask and answer msg found, search for duplicated row in askanswer.');
                            var askmsg = rows[0].msg;
                            var answermsg = rows[1].msg;
                            var values = [rows[0].msg, rows[1].msg];
                            var querystr = 'select * from cattiebot.askanswer where askmsg = ? and answermsg = ? and isGood = "Y"';
                            db.query(querystr,values,function(err,rows,fields){
                                if(err){
                                    console.log('step 2, search for duplicated row in askanswer failed.');
                                    res.send({'response':'error'});
                                } else {
                                    if(rows.length != 0){
                                        console.log('step 3, duplicated row in askanswer found.');
                                        res.send({'response':'success'});
                                    }else{
                                        console.log('step 3, no duplicated row in askanswer,  insert or update askanswer.');
                                        values = [answercid,answermid-1,askmsg,answermid,answermsg,'Y','Y'];
                                        querystr = 'insert into cattiebot.askanswer set cid = ?, askmid = ?, askmsg = ?, answermid = ?, answermsg = ? ,isGood = ? ON DUPLICATE KEY UPDATE isGood = ?';
                                        db.query(querystr,values,function(err,rows,fields){
                                            if(err){
                                                console.log('step 4, insert or update askanswer failed.');
                                                res.send({'response':'error'});
                                            } else {
                                                console.log('step 4, insert or update askanswer success, insert or update answerpattern.');
                                                //update or insert answerpattern
                                                var keywords = core.splitSentence(askmsg);
                                                var querystr = 'insert into cattiebot.answerpattern (keywords,cid,mid) values ';
                                                for(var i=0;i<keywords.length;i++){
                                                    values[i*3] = keywords[i];
                                                    values[i*3+1] = answercid;
                                                    values[i*3+2] = answermid;
                                                    querystr += '(?,?,?)';
                                                    if(i!=keywords.length-1){
                                                        querystr += ',';
                                                    } else {
                                                        values[(keywords.length-1)*3+3] = 'Y';
                                                    }
                                                }
                                                querystr += ' ON DUPLICATE KEY UPDATE isGood = ?';
                                                console.log('querystr:'+querystr);
                                                console.log('values:'+values.join(','));
                                                db.query(querystr,values,function(err,rows,fields){
                                                    if(err){
                                                        console.log('step 5, insert or update answerpattern failed.');
                                                        res.send({'response':'error'});
                                                    } else {
                                                        console.log('step 5, insert or update answerpattern success.');
                                                        res.send({'response':'success'});
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    
                                }
                            });
                        } else {
                            console.log('step 2, ask or answer msg not found.');
                            res.send({'response':'error'});
                        }
                    }
                });
            } else {
                //update askanswer
                console.log('step 2, update askanswer');
                values = [req.body.isGood, answercid, answermid];
                db.query('update cattiebot.askanswer set isGood = ? where cid = ? and answermid = ?',values,function(err,rows,fields){
                    if(err){
                        console.log('step 3, update askanswer failed');
                        res.send({'response':'error'});
                    }else{
                        //update answerpattern
                        console.log('step 3, update askanswer success, update answerpattern');
                        values = ['N', answercid, answermid];
                        db.query('update cattiebot.answerpattern set isGood = ? where cid = ? and mid = ?',values,function(err,rows,fields){
                            if(err){
                                console.log('step 4, update answerpattern failed');
                                res.send({'response':'error'});
                            }else{
                                console.log('step 4, update answerpattern success');
                                res.send({'response':'success'});
                            }
                        });
                    }
                });
            }
        }
    });
});

module.exports = router;