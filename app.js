var task             = require('./botTask.js');
var CirelliTinderBot = require('./CirelliTinderBot.js');

var bot        = new CirelliTinderBot(),
    likeTask   = new task.LikeTask(),
    filterTask = new task.FilterSpamTask();

function LikeListner(){};
LikeListner.prototype = new task.LikeTask.Listener();
LikeListner.prototype.onLiked = function(obj){
    console.log('******** ' + obj.totalCnt + ' **********\n' + obj.match.name + '\n\t' + obj.match._id + '\n\t' + obj.match.distance_mi + ' miles away.\n********************\n\n\n');
    if( obj && obj.data && obj.data.match ){
        console.log( 'Sending msg to: ' + obj.match._id + "\nMsg: Hi " + obj.match.name + "! How are you?");
        obj.oTinder.sendMessage( obj.match._id, "Hi " + obj.match.name + "! How are you?", function(error, data){
            if( !error ){
                console.log( 'Msg sent' + JSON.stringify(data) );
            }
        });
    }
};
LikeListner.prototype.onIdle = function( obj ){
    console.log('Going idle.' );
    console.log(JSON.stringify(obj));
}
LikeListner.prototype.onResume = function( obj ){
    console.log('Resumed');
    console.log(JSON.stringify(obj));
}


likeTask.register( new LikeListner() );
filterTask.register( new LikeListner() );

//bot.register( likeTask );
bot.register( filterTask );

//bot.addTask( likeTask );
bot.addTask( filterTask );
bot.start();
