// 载入模块
var Segment = require('segment');
// 创建实例
var segment = new Segment();
segment.useDefault();
segment.loadDict('user.txt');
segment.loadDict('./user.txt');
segment.loadSynonymDict('usersyn.txt')   // 同义词

module.exports = segment;