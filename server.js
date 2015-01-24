var express          = require('express');
var app              = express();
var crypto           = require('crypto');
var fs               = require('fs');
var nListeningPort   = 8383;
var task             = require('./botTask.js');
var CirelliTinderBot = require('./CirelliTinderBot.js');
var bots             = {};
var salt             = getSalt() || "yDp6SDwfCAEr4psufB4Pf4cMgJITZw5CDEiJWA4g8YPzFkcpOy2DQsZp3BLBJEY";//63 random alpha-numeric characters (a-z, A-Z, 0-9)

app.use(express.logger());
app.use(express.errorHandler());

app.get('/start', function( req, res ){
'use strict';
    var bot        = new CirelliTinderBot(),
        likeTask   = new task.LikeTask(),
        filterTask = new task.FilterSpamTask();
    var shasum     = crypto.createHash('sha1');
    var body       = {};

    shasum.update(req.query.cookie);
    shasum.update(salt);
    var d = shasum.digest('hex');
    console.log(d);
    bots[d] = bot;
    body.botId = d;

    //spamfilter
    //like
    body = JSON.stringify(req.query);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', body.length);
    res.end(body);
    //or
    //res.send(body);
});

app.get('/stop/:id', function( req, res ){
    'use strict';
    if( bots[req.params.id] ){
        var body = JSON.stringify(req.params.id);
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});

app.use(express.static(__dirname + '/bots'));

var server = app.listen(nListeningPort, function(){
  var host = server.address().address
  var port = server.address().port

  console.log('App listening at http://%s:%s', host, port)
});

function getSalt(fileName){
    fileName = fileName || 'salt.txt';
    try{
        return fs.readFileSync(fileName, 'utf-8');
    }catch(e){}
    return '';
}
