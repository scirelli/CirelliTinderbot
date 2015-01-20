var task             = require('./botTask.js');
var CirelliTinderBot = require('./CirelliTinderBot.js');

var bot = new CirelliTinderBot();

var listen = function(){};
listen.prototype = new CirelliTinderBot.Listener();
listen.prototype.onIdle = function( obj ){
    console.log('Going idle for ' + (obj.idleTime/1000/60) + 'mins' );
    console.log(JSON.stringify(obj));
}
listen.prototype.onResume = function( obj ){
    console.log('Resuming: ' + JSON.stringify(obj));
}

function LikeListner(){};
LikeListner.prototype = new task.LikeTask.Listener();
LikeListner.prototype.onLiked = function(obj){
    console.log('******** ' + obj.totalCnt + ' **********\n' + obj.match.name + '\n\t' + obj.match._id + '\n\t' + obj.match.distance_mi + ' miles away.\n********************\n\n\n');
};
LikeListner.prototype.onIdle = function( obj ){
    console.log('Going idle.' );
    console.log(JSON.stringify(obj));
}
LikeListner.prototype.onResume = function( obj ){
    console.log('Resumed');
    console.log(JSON.stringify(obj));
}

bot.register( new listen() );
bot.addTask( new task.LikeTask().register( new LikeListner() ) );
bot.start();
