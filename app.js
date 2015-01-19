var CirelliTinderBot = require('./CirelliTinderBot.js');

var bot = new CirelliTinderBot();

var listen = function(){};
listen.prototype = new CirelliTinderBot.Listener();
listen.prototype.onLiked = function( obj ){
    console.log('******** ' + obj.totalCnt + ' **********\n' + obj.match.name + '\n\t' + obj.match._id + '\n\t' + obj.match.distance_mi + ' miles away.\n********************\n\n\n');
}
listen.prototype.onChange = function( obj ){
    console.log('New list: ' + JSON.stringify(obj));
}
listen.prototype.onIdle = function( obj ){
    console.log('Going idle for ' + (obj.idleTime/1000/60) + 'mins' );
    console.log(JSON.stringify(obj));
}
listen.prototype.onResume = function( obj ){
    console.log(obj);
}

bot.register( new listen() );
bot.start();
