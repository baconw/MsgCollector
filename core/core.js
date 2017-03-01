'use strict';

var segment = require('../segment/setting');
var http = require('http');
var db = require('../database/setting');
var fs = require('fs');


var core = module.exports = function(){
    var obj = {
        wordTypeScore:{},
        startMengmengActive:startMengmengActive,
        requestnewcid:requestnewcid,
        setWordTypeScore:setWordTypeScore,
        saveMsgToDb:saveMsgToDb,
        sendMsgToSystem:sendMsgToSystem,
        sendCmdToSystem:sendCmdToSystem,
        getWordTypeScore:getWordTypeScore,
        splitSentence:splitSentence,
        analyseSentence:analyseSentence,
        saveWordToDict:saveWordToDict,
        isSingleWord:isSingleWord,
        combine:combine,
        sendMsgToMengMeng:sendMsgToMengMeng,
        sendMsgToTuling:sendMsgToTuling,
        incWordTypeScore:incWordTypeScore
    };
    
    return obj;
    
};

var setWordTypeScore = function() {
    console.log('setWordTypeScore is call');
    var me = this;
    if(!me.wordTypeScore[segment.POSTAG.D_A]){
        console.log('wordtypescore[segment.POSTAG.D_A] is null');
        me.wordTypeScore[segment.POSTAG.D_A] = 80;
        var querystr = 'select wordtype,score from cattiebot.wordtypescore';
        db.query(querystr,function(err,rows){
            if(err){
                console.log('set wordtypescore error' + err);
            }else{
                for(var i=0;i<rows.length;i++){
                    me.wordTypeScore[rows[i].wordtype] = rows[i].score;
                }
                console.log('wordTypeScore load finished:' + JSON.stringify(me.wordTypeScore));
            }

        });
    }else{
        console.log('wordTypeScore exists:' + JSON.stringify(me.wordTypeScore));
    }
    /*
    if(!this.wordTypeScore){
        this.wordTypeScore[segment.POSTAG.D_A] = 80;
        this.wordTypeScore[segment.POSTAG.D_I] = 100;
        this.wordTypeScore[segment.POSTAG.D_L] = 100;
        this.wordTypeScore[segment.POSTAG.D_N] = 90;
        this.wordTypeScore[segment.POSTAG.D_T] = 50;
        this.wordTypeScore[segment.POSTAG.D_V] = 80;
        this.wordTypeScore[segment.POSTAG.A_NR] = 100;
        this.wordTypeScore[segment.POSTAG.A_NS] = 100;
        this.wordTypeScore[segment.POSTAG.A_NT] = 100;
        this.wordTypeScore[segment.POSTAG.A_NX] = 100;
        this.wordTypeScore[segment.POSTAG.A_NZ] = 100;
        this.wordTypeScore[segment.POSTAG.UNK] = 50;
        this.wordTypeScore[segment.POSTAG.D_B] = 10;
        this.wordTypeScore[segment.POSTAG.D_C] = 5;
        this.wordTypeScore[segment.POSTAG.D_D] = 9;
        this.wordTypeScore[segment.POSTAG.D_E] = 30;
        this.wordTypeScore[segment.POSTAG.D_F] = 19;
        this.wordTypeScore[segment.POSTAG.A_M] = 29;
        this.wordTypeScore[segment.POSTAG.D_MQ] = 31;
        this.wordTypeScore[segment.POSTAG.D_O] = 55;
        this.wordTypeScore[segment.POSTAG.D_P] = 11;
        this.wordTypeScore[segment.POSTAG.A_Q] = 12;
        this.wordTypeScore[segment.POSTAG.D_S] = 13;
        this.wordTypeScore[segment.POSTAG.D_U] = 14;
        this.wordTypeScore[segment.POSTAG.D_W] = 0;
        this.wordTypeScore[segment.POSTAG.D_X] = 1;
        this.wordTypeScore[segment.POSTAG.D_Y] = 54;
        this.wordTypeScore[segment.POSTAG.D_Z] = 21;
        this.wordTypeScore[segment.POSTAG.D_ZH] = 3;
        this.wordTypeScore[segment.POSTAG.D_K] = 3;
        this.wordTypeScore[segment.POSTAG.URL] = 0;
        this.wordTypeScore[segment.POSTAG.D_R] = 22;

        console.log('wordTypeScore load finished:' + JSON.stringify(this.wordTypeScore));
    }
    */
}

var saveWordToDict = function (word) {
    //var options = { encoding: 'utf8', mode: 438 /*=0666*/, flag: 'a' };
    fs.appendFile('./segment/user.txt',word, function(err){
        if(err){
            console.log('append file error:' + err);
        }
    });
}

/*
function splitSentence(sentence){
    var me = this;
    console.log('splitSentence is called');
    var KEYWORD_MAX_COUNT = 3;
    var analyseResult = this.analyseSentence(sentence);

    var tocombine = new Array();
    for (var j = 0; j < analyseResult.length && j < KEYWORD_MAX_COUNT; j++) {
        var wordValue = analyseResult[j].w;
        tocombine.push(wordValue);
    }

    var result = combine(tocombine);
    
    console.log(result.join(","));
    return result;

}
*/

var getWordTypeScore = function() {
    console.log('getWordTypeScore is called');
    return this.wordTypeScore;
}

var incWordTypeScore = function(wordType){
    console.log('incWordTypeScore is called');
    this.wordTypeScore[wordType]++;
}

var analyseSentence = function(sentence){
    console.log('analyseSentence is called');
    
    //断句：含有‘可是’‘但是’‘因为’‘由于’等连接词的

    //过滤规则：保留reservedWord的词，删掉abandonWordType。最后必须剩下至少一个词，如果剩下的词是‘呢’‘吗’，则还需要再保留一个词。
    var reservedWord = new Array();
    reservedWord.push('不');
    reservedWord.push('呢');
    reservedWord.push('吗');
    reservedWord.push('吧');
    reservedWord.push('可以');
    reservedWord.push('哼');
    reservedWord.push('是谁');
    reservedWord.push('别');
    reservedWord.push('什么');
    reservedWord.push('怎样');
    reservedWord.push('怎么');
    reservedWord.push('哪里');
    reservedWord.push('谁');
    reservedWord.push('哪');
    reservedWord.push('么');
    reservedWord = reservedWord.toString();

    var wordTypeScore = this.getWordTypeScore();
    console.log('wordTypeScore: ' + JSON.stringify(wordTypeScore));

    var replaceWord = new Array();
    replaceWord.push({ '萌萌': '我' });
    replaceWord.push({ '图灵机器人': '我' });
    replaceWord.push({ '图灵': '我' });
    replaceWord.push({ '机器人': '我' });
    
    //各词性权重，比较重要的词v,i,l,p

    //录入方法：首先整理出一个最简洁的句子，取出最重要的3个词，按顺序录入数据库

    //匹配方法：首先整理出一个最简洁的句子，然后以该句子最重要的3个词顺序匹配数据库，如果找不到，则删掉第一个词，重新匹配，如此循环，如果匹配不到，则用句子里
    //的单个v，i，l或者p来匹配，最后如果还匹配不到，则返回默认句子
    
    var msg = sentence.replace(/[^\u4e00-\u9fa5]/gi, "");
    
    var splitwords = segment.doSegment(msg, {convertSynonym: true});
    console.log('before:'+JSON.stringify(splitwords));

    for(var j in splitwords){
        var wordValue = splitwords[j].w;
        var wordType = splitwords[j].p;
        var wordScore = wordTypeScore[wordType];
        if(wordScore == null){
            wordScore = 50;
        }
        splitwords[j].p = wordScore;
        //console.log('wordValue:' + wordValue + ' type:' + wordType + ' score:' + wordScore);
    }

    splitwords.sort(function(a,b){
        if(a.p<b.p){
            return 1;
        }else if(a.p>b.p){
            return -1;
        }
        return 0;
    });

    console.log('after:'+JSON.stringify(splitwords));
    
    return splitwords;

    
}

var splitSentence =  function (sentence) {
    console.log('core.splitSentence is called');
    var me = this;
    console.log('splitSentence is called');
    var KEYWORD_MAX_COUNT = 3;
    var analyseResult = this.analyseSentence(sentence);

    var tocombine = new Array();
    for (var j = 0; j < analyseResult.length && j < KEYWORD_MAX_COUNT; j++) {
        var wordValue = analyseResult[j].w;
        tocombine.push(wordValue);
    }

    var result = combine(tocombine);
    
    console.log(result.join(","));
    return result;
}

var isSingleWord =  function (word) {
    var splitwords = segment.doSegment(word, {simple: true});
    if(splitwords.length == 1 && splitwords[0] == word){
        return true;
    }else{
        return false;
    }
}

var combine = function(splitwords){
    console.log('call combine: ' + JSON.stringify(splitwords));
    var result = new Array();

    for (var j = 0; j < splitwords.length; j++) {
        var wordValue = splitwords[j];
        result.push(wordValue);
    }
    
    for (var j = 0; j+1 < splitwords.length; j++) {
        var wordValue = splitwords[j]+'|'+splitwords[j+1];
        result.push(wordValue);
    }
    
    for (var j = 0; j+2 < splitwords.length; j++) {
        var wordValue = splitwords[j]+'|'+splitwords[j+2];
        result.push(wordValue);
    }
    
    for (var j = 0; j+2 < splitwords.length; j++) {
        var wordValue = splitwords[j]+'|'+splitwords[j+1]+'|'+splitwords[j+2];
        result.push(wordValue);
    }

    console.log('call combine finished : ' + JSON.stringify(result));

    return result;
}

var startMengmengActive = function() {
    this.setWordTypeScore();

    var data = {
        channelid: "2101",
        imei: "e7135315e42683dc35c753e8581b95e5",
        version: "3.2"
    };

    data = require('querystring').stringify(data);

    var opt = {
        method: "POST",
        host: 'm.mengbaotao.com',
        port: '80',
        path: '/api.php?cmd=startActive',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            "Content-Length": data.length,
            'User-Agent': 'èå¤©ç«æäºº 3.2 rv:3.2.1 (iPhone; iPhone OS 9.0.2; zh_CN)'
        }
    };

    var req = http.request(opt, function (serverFeedback) {
        if (serverFeedback.statusCode == 200) {
            var body = "";
            serverFeedback.on('data', function (data) { body += data; })
                .on('end', function () { console.log('response:' + body); });
        }
        else {
            console.log("error");
        }
    });
    req.write(data + "\n");
    req.end();
};

function displayMengMengResponse(msgDetail){
    msgDetail.msg = msgDetail.msg.replace(/^\s+/g,"").replace(/\s+$/g,"");
    msgDetail.msg = msgDetail.msg.replace(/萌萌/g,"小呆").replace(/雷锋/g,"主人");    
msgDetail.msg = msgDetail.msg.replace(new regexp(mengmengStr),xiaodaiStr).replace(new regexp(leifengStr),zhurenStr);    
console.log('mengmeng said 2:' + msgDetail.msg);
    if(msgDetail.msg == ""){
        var values = [msgDetail.cid, msgDetail.mid];
        db.query('SELECT msg FROM cattiebot.msgcollector where conversationId = ? and msgid = ?',values,function(err,rows){
            if(err){
                console.log('error querystr:' + err);
                msgDetail.res.send({ 'response': '脑袋短路。' , 'status':'Failed'});
            }else{
                if(rows.length == 1){
                    msgDetail.msg = rows[0].msg;
                    console.log('call sendMsgToMengMeng again');
                    sendMsgToMengMeng(msgDetail,displayMengMengResponse);
                }else{
                    console.log('can not found previous message');
                    msgDetail.res.send({ 'response': '脑袋短路。。' , 'status':'Failed'});
                }
            }
        });
        
    } else {
	

        msgDetail.req.session.mid++;
        msgDetail.mid = msgDetail.req.session.mid;
        msgDetail.fromWho = "mengmeng";
        msgDetail.toWho = msgDetail.req.session.user;
        saveMsgToDb(msgDetail);       
 
        msgDetail.res.send({ 'response': msgDetail.msg , 'status':'Succeed'});
    }
}

var sendMsgToSystem = function (msgDetail, req, res) {
    console.log('sendMsgToSystem is called');
    var me = this;
    var analyseResult = me.analyseSentence(msgDetail.msg);
    var keywords = new Array();
    for(var i in analyseResult){
        keywords.push(analyseResult[i].w);
    }
    //search for answers
    var values = [analyseResult[0].w];
    var querystr = 'select * from cattiebot.answerpattern where keywords = ? and isGood = "Y"';
    db.query(querystr,values,function(err,rows,fields){
        if(err){
            console.log('error querystr:' + querystr);
            res.send({ 'response': '脑袋短路。。。' , 'status':'Failed'});
        } else {
            if(rows.length>0){
                querystr = 'SELECT group_concat(distinct keywords) as c,cid,mid,0 as score FROM cattiebot.answerpattern where keywords in (';
                for(var i=0;i<keywords.length;i++){
                    querystr += '?';
                    if(i != keywords.length-1){
                        querystr += ',';
                    }else{
                        querystr += ') and answerpattern.isgood="Y" group by mid,cid';
                    }
                }
                console.log('querystr:'+querystr);
                db.query(querystr,keywords,function(err,rows,fields){
                    if(err){
                        console.log('error querystr:' + querystr);
                        res.send({ 'response': '脑袋短路。。。。' , 'status':'Failed'});
                    }else{
                        if(rows.length == 0 ){
                            console.log('result not found querystr:' + querystr);
                            //res.send({ 'response': '小鸡无言以对' });
                            sendMsgToMengMeng(msgDetail,displayMengMengResponse);
                        } else {
                            var bestScore = 0;
                            var bestRows = new Array();
                            //var wordTypeScore = me.getWordTypeScore();
                            for(var i=0;i<rows.length;i++){
                                var splitc = rows[i].c.split(',');
                                for(var j in splitc){
                                    var score = 0;
                                    for(var k in analyseResult){
                                        //console.log('analyseResult[k].w:'+analyseResult[k].w+' splitc[j]:'+splitc[j]);
                                        if(splitc[j] == analyseResult[k].w){
                                            score = analyseResult[k].p;
                                            break;
                                        }
                                    }
                                    
                                    rows[i].score+=score;
                                    //console.log('keywords:'+ splitc[j] + ' score:' + rows[i].score + ' cid:' + rows[i].cid + ' mid:' + rows[i].mid);
                                }
                                if(rows[i].score > bestScore){
                                    bestScore = rows[i].score;
                                    if(bestRows.length > 0){
                                        bestRows = new Array();
                                    }
                                    bestRows.push(rows[i]);
                                }else if(rows[i].score == bestScore){
                                    bestRows.push(rows[i]);
                                }
                            }
                            //console.log('bestRows length:' + bestRows.length);
                            
                            //select random row from bestRows
                            var r = Math.floor(Math.random()*bestRows.length);
                            var values = [bestRows[r].cid, bestRows[r].mid];
                            querystr = 'select * from cattiebot.askanswer where cid = ? and answermid = ? and isGood = "Y"';
                            db.query(querystr,values,function(err,rows,fields){
                                if(err){
                                    console.log('error querystr:' + querystr);
                                    res.send({ 'response': '小鸡机器人睡了' , 'status':'Failed'});
                                }else{
                                    console.log('query askanswer result length:' + rows.length);
                       
                                    req.session.mid++;
                                    msgDetail.mid = req.session.mid;
                                    msgDetail.toWho = msgDetail.fromWho;
                                    msgDetail.fromWho = "system";
                                    msgDetail.msg = rows[0].answermsg;
                                    saveMsgToDb(msgDetail); 
                                    
                                    res.send({ 'response': rows[0].answermsg , 'status':'Succeed'});
                                }
                            });
                        }
                    }
                });
            }else{
                sendMsgToMengMeng(msgDetail,displayMengMengResponse);
            }
        }
    });
    
    
}

var sendMsgToMengMeng = function(msgDetail, callback){
    console.log('sendMsgToMengMeng is called');
    var data = {
        msg: msgDetail.msg,
        channelid: "2101",
        openid: "e7135315e42683dc35c753e8581b95e5",
        version: "3.2"
    };

    data = require('querystring').stringify(data);

    var opt = {
        method: "POST",
        host: 'm.mengbaotao.com',
        port: '80',
        path: '/api.php?cmd=chatCallback',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            "Content-Length": data.length,
            'User-Agent': 'èå¤©ç«æäºº 3.2 rv:3.2.1 (iPhone; iPhone OS 9.0.2; zh_CN)'
        }
    };

    var req = http.request(opt, function (serverFeedback) {
        if (serverFeedback.statusCode == 200) {
            var body = "";
            serverFeedback.on('data', function (data) { body += data; })
                .on('end', function () {
                    //console.log('tuling response:'+body);
                    try{
                        var jsonObj = JSON.parse(body);
                        var responseMsg = jsonObj.ret_message;
                        if (responseMsg.substring(0, 1) == '/') {
                            responseMsg = translateMengmengEmotion(responseMsg);
                        }
                        msgDetail.msg = responseMsg;
                        callback(msgDetail);
                    } catch (e) {
                        console.log(e.name + ': ' + e.message);
                        msgDetail.msg = '我傻了';
                        callback(msgDetail);
                    }

                }).on('error', function (err) {
                    console.log('error:' + err);

                });
        }
        else {
            console.log("error");
        }
    });
    req.on('error', function (e) {
        console.log('network error from mengmeng');
    });
    req.write(data + "\n");
    req.end();
}

var sendCmdToSystem = function (msgDetail, req, res) {
    console.log('sendCmdToSystem is called');
    
    //search for answers
    var values = [msgDetail.msg];
    var querystr = 'select * from cattiebot.preparedask where type = ?';
    db.query(querystr,values,function(err,rows,fields){
        if(err){
            console.log('error querystr:' + querystr);
            res.send({ 'response': '小鸡机器人睡了' , 'status':'Failed'});
        } else {
            if(rows.length>0){
                var r = Math.floor(Math.random()*rows.length);

                req.session.mid++;
                msgDetail.mid = req.session.mid;
                msgDetail.toWho = req.session.user;
                msgDetail.fromWho = "system";
                msgDetail.msg = rows[r].askmsg;
                saveMsgToDb(msgDetail); 

                res.send({ 'response': rows[r].askmsg , 'status':'Succeed'});
            }else{
                console.log('找不到预设问题type='+msgDetail.msg);
                res.send({ 'response': '找不到预设问题type='+msgDetail.msg , 'status':'Failed'});
            }
        }
    });
}

var requestnewcid = function(uid,callback){
    console.log("requestnewcid is called");
    var cid;
    db.query('SELECT max(cid) as cid FROM cattiebot.conversation;', function (err, rows, fields) {
        if(err){
            console.log('err requestnewcid:' + err);
        }else{
            cid = rows[0].cid;
            if (cid == null) {
                //console.log('cid is null');
                cid = 1;
            }else{
                cid = cid+1;
            }
            
            var values = [cid, uid];
            console.log('generating new cid:'+cid);
            db.query('insert into cattiebot.conversation set cid = ?, uid = ?', values, function (err, rows, fields) {
                if(err){
                    console.log('err generating new cid:' + err);
                    
                }else{
                    callback(cid);
                }
            });
        }
    });
}

var saveMsgToDb = function(msgDetail){
    console.log('saveMsgToDb is called');
    var isGood = null;
    if(msgDetail.fromWho == "system"){
        isGood = 'Y';
    }
    if(msgDetail.mid == 1 || msgDetail.msg == '' || msgDetail.msg.indexOf('的生日') >= 0 || msgDetail.msg.indexOf('图灵机器人听到') >= 0 || msgDetail.msg.indexOf('小游戏') >= 0){
        isGood = 'N';
    }

    var values = [msgDetail.cid,msgDetail.mid,msgDetail.msg];
    var querystr = 'select isGood from  cattiebot.askanswer where askmsg = (select msg from cattiebot.msgcollector where conversationId = ? and msgid = (?-1)) and answermsg = ?';
    db.query(querystr,values,function(error, results) {
        if (error) {
            console.log("Save db Error: " + error.message);
        } else {
            if(results.length > 0){
                isGood = results[0].isGood;
            }
            values = [msgDetail.cid,msgDetail.mid,msgDetail.msg,msgDetail.fromWho,msgDetail.toWho,isGood];
            db.query('INSERT INTO cattiebot.msgcollector SET conversationId = ?, msgid = ?, msg = ? , fromWho = ? , toWho = ? , isGoodAnswer = ?', values,
                function (error, results) {
                    if (error) {
                        console.log("Save db Error: " + error.message);
                    } else {
                        console.log("Save db Success cid:" + msgDetail.cid + " mid:" + msgDetail.mid); 
                    }
                }
            );
        }
    });
}

/*
core.prototype.saveMsgToDb = function(msgDetail){
    saveMsgToDb(msgDetail);
};
*/

var sendMsgToTuling =  function (msgDetail, callback) {
    var data = {
        "key": "282cd5374f914f40a101e86e90f0b7c6",
        "info": msgDetail.msg,
        "userid": "mengmeng"
    };

    var bodyString = JSON.stringify(data);
    var opt = {
        method: 'POST',
        host: 'www.tuling123.com',
        port: '80',
        path: '/openapi/api'
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
                   
                    
                    if (jsonObj.code == 100000 && jsonObj.text != msgDetail.msg) {
                        msgDetail.msg = responseMsg;
                        callback(msgDetail);
                        
                    } else {
                        console.log('jsonObj.code:' + jsonObj.code + ' jsonObj.text:' + jsonObj.text);
                        msgDetail.msg = '我傻眼了';
                        callback(msgDetail);
                    }
                }).on('error', function (err) {
                    console.log('error:' + err);

                });
        }
        else {
            console.log("error");
        }

    });
    req.on('error', function (e) {
        console.log('network error from tulin');
    });
    req.write(bodyString + "\n");
    req.end();
};

function translateMengmengEmotion(input) {
    console.log('call translateMengmengEmotion:' + input);
    var output = '';
    if (input == '/:hug') {
        output = '抱抱';
    }else{
        output = '不知名符号 ' + input;
    }
    return output;
}

