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

var likeListner = function(){};
likeListner.prototype = new task.Listener();
likeListner.prototype.onLike = function(obj){
    console.log('******** ' + obj.totalCnt + ' **********\n' + obj.match.name + '\n\t' + obj.match._id + '\n\t' + obj.match.distance_mi + ' miles away.\n********************\n\n\n');
};

bot.register( new listen() );
bot.addTask( new task.LikeTask().add( likeListner ) );
bot.start();
