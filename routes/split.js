var express = require('express');
var http = require('http');
var db = require('../database/setting');
var router = express.Router();
var core = require('../core/manage.js');
var segment = require('../segment/setting');

router.get('/', function(req, res, next) {
    console.log('call /split');
    //var singleKeywords = ['我','饿','死'];
    //var test = core.combine(msg);
    //var msg = "给我们";
    //var test = core.isSingleWord(msg);
    //console.log(test);
    /*
    for(var i=0;i<singleKeywords.length;i++){
        core.saveWordToDict(singleKeywords[i]+'|0x0|100\n');
    }
    */
    
    db.query('SELECT count(*) as c from cattiebot.askanswer where isGood = "Y"', function(err, rows, fields) {
        var msgCount = 0;
        if(err){
            console.log('error:' + err);
        }else{
            msgCount = rows[0].c;
        }
        console.log('msgCount:' + msgCount);
        res.render('split', {'msgCount':msgCount});
    });
    
    //res.render('manage', {'msgCount':0});
});

router.get('/splitlist', function(req, res, next) {
    console.log('call /manage/msglist pageSize:' + req.query.pageSize + ' pageNumber:' + req.query.pageNumber);
    var pageSize = parseInt(req.query.pageSize);
    var pageNumber = parseInt(req.query.pageNumber);
    //var pageSize = 20;
    //var pageNumber = 1;
    var values = [(pageNumber-1)*pageSize,pageSize];
    db.query('SELECT id,msg,isGoodAnswer from cattiebot.msgcollector limit ?,?',values, function(err, rows, fields) {
        var msgListValue = new Array();
        if(err){
            msgListValue.push('error:'+err);
        }else{
            var rowLength = rows.length;
            //var rowLength = 20;
            for(var i = 0;i<rowLength;i++){
                msgListValue.push(rows[i].id + ':' + rows[i].msg + ':' + rows[i].isGoodAnswer);
            }
        }
        res.send( { msgList: msgListValue } );
    });
});

router.post('/audit', function(req, res, next){
    //console.log('call /split/audit:' + req.body.keywords);//我饿死了 -> 我，饿 'cid':cid,'mid':mid,'isChanged':change,'keywords':keywords2}
    var isChanged = req.body.isChanged;
    var cid = req.body.cid;
    var mid = req.body.mid;
    
    //update askanswer set isAudit = Y
    console.log('step 1. update askanswer set isAudit = Y');
    var values = [cid,mid];
    var querystr = 'update cattiebot.askanswer set isAudit = "Y" where cid = ? and answermid = ?';
    db.query(querystr,values,function(err,rows) {
        if(err){
            console.log('step 2. update askanswer set isAudit = Y failed');
            res.send({'response':'error'});
        }else{
            console.log('step 2. update askanswer set isAudit = Y success');
            if(isChanged == "Y"){
                //update answerpattern, set isGood = N by cid,mid
                console.log('step 3. update answerpattern, set isGood = N by cid,mid');
                var values = [cid,mid];
                var querystr = 'update cattiebot.answerpattern set isGood = "N" where cid = ? and mid = ?';
                db.query(querystr,values,function(err,rows) {
                    if(err){
                        console.log('step 4. update answerpattern failed');
                        res.send({'response':'error'});
                    }else{
                //insert new rows by keywords,cid,mid, if duplicated, update set isGood = Y
                        console.log('step 4. update answerpattern success, insert new record to answerpattern or update.');
                        var keywords = req.body.keywords.split(',');
                        var singleKeywords = new Array();
                        //for save to user dict
                        for(var i=0;i<keywords.length;i++){
                            if(!core.isSingleWord(keywords[i])){
                                singleKeywords.push(keywords[i]);
                            }
                        }
                        //for save to user dict end
                        keywords = core.combine(keywords);
                        var querystr = 'insert into cattiebot.answerpattern (keywords,cid,mid) values ';
                        for(var i=0;i<keywords.length;i++){
                            values[i*3] = keywords[i];
                            values[i*3+1] = cid;
                            values[i*3+2] = mid;
                            querystr += '(?,?,?)';
                            if(i!=keywords.length-1){
                                querystr += ',';
                            } else {
                                values[(keywords.length-1)*3+3] = 'Y';
                            }

                            //set wordtypescore
                            /*
                            var splitwords = segment.doSegment(keywords[i], {convertSynonym: true});
                            var wordValue = splitwords[0].w;
                            var wordType = splitwords[0].p;   
                            console.log('update wordtypescore word:' + wordValue + ' type:' + wordType);  
                            core.incWordTypeScore(splitwords[0].p);
                            var wordtype = [splitwords[0].p];
                            db.query('update cattiebot.wordtypescore set score = score + 1 where wordtype = ?',wordtype,function(err,rows){
                                if(err){
                                    console.log('update wordtypescore failed');
                                }else{
                                    console.log('update wordtypescore success');
                                }
                            });
                            */
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
                //save the new keyword to user dict
                                for(var i=0;i<singleKeywords.length;i++){
                                    core.saveWordToDict(singleKeywords[i]+'|0x0|100\n');
                                }
                                res.send({'response':'success'});
                            }
                        }); 
                    }
                });
            }else{
                res.send({'response':'success'});
            }
        }
    });
});

router.get('/msglist', function(req, res, next) {
    console.log('call /split/msglist pageSize:' + req.query.pageSize + ' pageNumber:' + req.query.pageNumber);
    var pageSize = parseInt(req.query.pageSize);
    var pageNumber = parseInt(req.query.pageNumber);
    //var pageSize = 20;
    //var pageNumber = 1;
    var values = [(pageNumber-1)*pageSize,pageSize];
    db.query('SELECT askanswer.cid,askanswer.answermid,askanswer.isAudit,askanswer.askmsg, askanswer.answermsg,GROUP_CONCAT(keywords SEPARATOR ",") as k FROM cattiebot.answerpattern,cattiebot.askanswer where askanswer.isgood="Y" and answerpattern.isgood = "Y" and  answerpattern.cid = askanswer.cid and answerpattern.mid = askanswer.answermid and keywords not like "%|%" group by answerpattern.cid,answerpattern.mid limit ?,?',values, function(err, rows, fields) {
        
        var msgListValue = new Array();
        if(err){
            msgListValue.push('error:'+err);
        }else{
            var rowLength = rows.length;
            //var rowLength = 20;
            for(var i = 0;i<rowLength;i++){
                msgListValue.push(rows[i].cid + ':' + rows[i].answermid + ':' + rows[i].isAudit + ':' + rows[i].askmsg + ':' + rows[i].answermsg + ':' + rows[i].k);
            }
        }
        res.send( { msgList: msgListValue } );
    });
});

module.exports = router;