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
    var botId      = '';

    shasum.update(req.query.cookie);
    shasum.update(salt);
    botId = shasum.digest('hex');
    console.log(botId);
    
    if( req.query.like == 'like' ){
        likeTask.register( new LikeListner(botId) );
        bot.addTask( likeTask );
    }
    if( req.query.filter == 'spamfilter' ){
        filterTask.register( new SpamListener(botId) );
        bot.addTask( filterTask );
    }

    bots[botId] = bot;
    bot.start( req.query.cookie );

    body.botId = botId;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', body.length);
    res.end( JSON.stringify(body) );
});

app.get('/stop/:id', function( req, res ){
    'use strict';
    if( bots[req.params.id] ){
        bots[req.params.id].stop();
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
function LikeListner( sBotId ){
    var MAX_BUFFER_SIZE  = 5;
    this.sBotId         = sBotId;
    this.oBufferedWriter = new BufferedStringFileWriter( __dirname + '/bots/' + sBotId + '_like.log', this.MAX_BUFFER_SIZE );
};
LikeListner.prototype = new task.LikeTask.Listener();
LikeListner.prototype.onLiked = function(obj){
    var data = '';
    var me   = this;

    console.log('******** ' + obj.totalCnt + ' **********\n' + obj.match.name + '\n\t' + obj.match._id + '\n\t' + obj.match.distance_mi + ' miles away.\n********************\n\n\n');

    data += obj.totalCnt + ': ' + obj.match.name + '(' + obj.match._id + ') ' + obj.match.distance_mi + ' miles away.\n';
    //oData.recommendation = obj;
    this.oBufferedWriter.appendBuffer(data);

    if( obj && obj.data && obj.data.match ){
        console.log( 'Sending msg to: ' + obj.match._id + "\nMsg: Hi " + obj.match.name + "! How are you?");
        obj.oTinder.sendMessage( obj.match._id, "Hi " + obj.match.name + "! How are you?", function(error, data){
            if( !error ){
                var data = 'Msg sent to ' + obj.match.name + '(' + obj.match._id + ')\n';
                console.log( 'Msg sent' + JSON.stringify(data) );
                me.oBufferedWriter.appendBuffer(data);
            }
        });
    }
};
LikeListner.prototype.onIdle = function( obj ){
    console.log('Liker going idle.' );
    if( obj.reason.data ){
        console.log(obj.reason.data);
    }else{
        console.log(obj.reason.error);
    }

}
LikeListner.prototype.onResume = function( obj ){
    console.log('Liker resumed');
    console.log(JSON.stringify(obj));
}

function SpamListener( sBotId ){
    var MAX_BUFFER_SIZE  = 5;
    this.sBotId         = sBotId;
    this.oBufferedWriter = new BufferedStringFileWriter( __dirname + '/bots/' + sBotId + '_spam.log', this.MAX_BUFFER_SIZE );
};
SpamListener.prototype = new task.FilterSpamTask.Listener();
SpamListener.prototype.onSpam = function( obj ){
    console.log('Spam found:');
    console.log(JSON.stringify(obj));
    this.oBufferedWriter.appendBuffer( JSON.stringify(obj) + '\n' );
}
SpamListener.prototype.onIdle = function( obj ){
    console.log('Spam Filter going idle.' );
    if( obj.reason.data ){
        console.log(obj.reason.data);
    }else{
        console.log(obj.reason.error);
    }

}
SpamListener.prototype.onResume = function( obj ){
    console.log('Spam Filter resumed');
    console.log(JSON.stringify(obj));
}

function BufferedStringFileWriter ( sFilename, nMaxBufferSize ){
    this.nMaxBufferSize = parseInt(nMaxBufferSize) || 50;
    this.aMsgBuffer     = [];
    this.sFilename      = sFilename;
    this.interval       = 0;
}
BufferedStringFileWriter.prototype.appendBuffer = function(data){
    this.aMsgBuffer.push(data);
    if( this.aMsgBuffer.length > this.MAX_BUFFER_SIZE ){
        this.flushBuffer();
    }
    if( this.interval == 0 ){
        var me = this;
        this.interval = setTimeout(function(){
            me.flushBuffer();
        }, 1000*60*2 );
    }
}
BufferedStringFileWriter.prototype.flushBuffer = function(){
    var me = this;
    if( this.aMsgBuffer.length ){
        fs.appendFile( this.sFilename, this.aMsgBuffer.join(''), function(err){
            if( !err ){
                me.clearBuffer();
            }else{
                console.error(err);
            }
        });
    }
}
BufferedStringFileWriter.prototype.clearBuffer = function(){
    this.aMsgBuffer = [];
    clearTimeout(this.interval);
    this.interval = 0;
}
