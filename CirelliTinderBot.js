var Q       = require('q');
var fs      = require('fs');
var tinder  = require('./tinder.js');
var request = require('request');
var sc      = require('./IChangeRegistrar.js');
require('./extras-math.js');

function CirelliTinderBot(){
"use strict";
    var NO_RESULTS_DELAY      = 15*60*1000;//15mins
    var RECOMMENDATIONS_LIMIT = 15;

    var tin              = new tinder.TinderClient();
    var totalCnt         = 0;
    var likesRemaining   = 100;
    var userId           = '';          //Get it here http://findmyfacebookid.com/
    var cookie           = '';          //FB cookie: Open your favorite browser and JS debugger and do a window.document.cookie
    var fbTokenExpiresIn = new Date(new Date().getTime() - 60 * 20 * 1000);//some time in the past;
    var me               = this;

    function run(){
        if( !userId && !cookie ){
            throw 'Need to set userId and cookie first.';
        }
        if( isFBTokenExpired() ){
            authorize().then(run,function(reason){
                throw 'Could not authorize: ' + reason.error;
            }).done();
        }else{//run tasks
            tin.getRecommendations(RECOMMENDATIONS_LIMIT,function handleResults(error, data){
                if( data && data.results && data.results.length ){
                    me.changePub.change({totalCnt:totalCnt+data.results.length, data:data.results});
                    likeAllRecs( data.results, 0, data.results.length );
                }else{
                    //me.log('No one left to like! Waiting ' + (NO_RESULTS_DELAY/1000/60) + 'mins');
                    //me.log(JSON.stringify(data));
                    me.changePub.idle({data:data, idleTime:NO_RESULTS_DELAY});
                    Q.delay(NO_RESULTS_DELAY).then(function(){
                        me.changePub.resume();
                        run();
                    }).done();
                }
            });
        }
    }
    
    function likeAllRecs( aRecs, index, sz ){
        void function loop( a, index, sz ){
            var defered = Q.defer();
            if( index >= sz ){
                defered.reject({error:'Done', a:a, index:index, sz:sz});
            }else{
                var e       = a[index];
                totalCnt++;
                //me.log('******** ' + totalCnt + ' **********\n' + e.name + '\n\t' + e._id + '\n\t' + e.distance_mi + ' miles away.\n********************\n\n\n');
                tin.like(e._id,function(error, data){
                    if( error ){
                        debugger;
                        defered.reject({error:error, data:data, a:a, index:index, sz:sz});
                    }else{
                        likesRemaining = data.likes_remaining;
                        me.changePub.liked({totalCnt:totalCnt, match:e,data:data});
                        defered.resolve({error:error, data:data, a:a, index:index, sz:sz});
                    }
                });
            }
            return defered.promise;
        }( aRecs, index, sz ).delay(me.LIKE_DELAY).then(
            function resolve0(result){
                return likeAllRecs( result.a, result.index+1, result.sz );
            },
            function reject0(){
                run();
            }
        ).done();
    }

    function authorize(){
        var defered = Q.defer();
        getFBAccessToken().then(function(fbToken){
            tin.authorize(fbToken, userId, function( response ){
                if( response && response.error ){
                    defered.reject({authorized:false, error:response.error});
                }else{
                    defered.resolve({authorized:true});
                }
            });
        });
        return defered.promise;
    }

    function getFBAccessToken(){
        var defered = Q.defer();
        var opts = {
            url:'https://www.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=public_profile,user_friends,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token',
            method:'GET',
            followAllRedirects:false,
            headers:{
                'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
                'Cookie':cookie
            }
        };

        request(opts,function( error, res, body ){
            var access_token     = '',
                expiryInSeconds  = '';

            fbTokenExpiresIn = new Date(new Date().getTime() - 60 * 20 * 1000);//some time in the past;

            if( res && res.request && res.request.uri && res.request.uri.href ){
                var hash         = res.request.uri.href,
                    tokenField   = "access_token=",
                    expiresField = "&expires_in=";

                access_token     = hash.substring(hash.indexOf(tokenField) + tokenField.length, hash.indexOf(expiresField));
                expiryInSeconds  = hash.substring(hash.indexOf(expiresField) + expiresField.length);
                fbTokenExpiresIn = new Date(new Date().getTime() + expiryInSeconds * 1000);
            }
            if( access_token ){
                defered.resolve(access_token);
            }else{
                defered.reject('Could not get FB token');
            }
        });

        return defered.promise;
    }

    function tinderAuth( fbToken, userId ){
        var defered = Q.defer();
        tin.authorize( fbToken, userId, function(){
            defered.resolve(true);
        });
    }

    function isFBTokenExpired(){
        if( new Date().getTime() >= fbTokenExpiresIn.getTime() ){
            return true;
        }
        return false;
    }
    
    this.logError = function( str ){
        console.log(str);
    }
    this.log = function( str ){
        console.log(str);
    }

    this.changePub  = new CirelliTinderBot.ChangePublisher();
    this.register   = function(obj){this.changePub.register(obj)};
    this.unregister = function(obj){this.changePub.unregister(obj)};
    Object.defineProperty(this, "LIKE_DELAY", { get: function(){ return ~~Math.rndRange(800,1500); } });
    this.setUserId = function(usrId){
        userId = usrId;
    }
    this.setFBCookie = function(fbCookie){
        cookie = fbCookie;
    }
    this.start = function( usrId, fbCookie ){
        this.setUserId( usrId || CirelliTinderBot.getUserIdFromFile() );
        this.setFBCookie( fbCookie || CirelliTinderBot.getFBCookieFromFile());
        run();
    }
}

CirelliTinderBot.getUserIdFromFile = function(fileName){
    fileName = fileName || 'userid.txt';
    try{
        return fs.readFileSync('userid.txt', 'utf-8');//Get userid from http://findmyfacebookid.com/
    }catch(e){}
    return '';
}

CirelliTinderBot.getFBCookieFromFile = function(fileName){
    fileName = fileName || 'cookie.txt';
    try{
        return fs.readFileSync(fileName, 'utf-8');
    }catch(e){}
    return '';
}

CirelliTinderBot.ChangePublisher = function(){
    sc.AChangePublisherWithDNN.call(this);
};
CirelliTinderBot.ChangePublisher.prototype = new sc.AChangePublisherWithDNN();
CirelliTinderBot.ChangePublisher.prototype.liked = function( obj, oDoNotNotifyThisListener ){
    return this._achange('onLiked', obj, oDoNotNotifyThisListener);;
}
CirelliTinderBot.ChangePublisher.prototype.idle = function( obj, oDoNotNotifyThisListener ){
    return this._achange('onIdle', obj, oDoNotNotifyThisListener);;
}
CirelliTinderBot.ChangePublisher.prototype.resume = function( obj, oDoNotNotifyThisListener ){
    return this._achange('onResume', obj, oDoNotNotifyThisListener);;
}
CirelliTinderBot.ChangePublisher.prototype.register = function(obj){
    if( obj.onLiked && obj.onIdle && obj.onResume ){
        return sc.AChangePublisher.prototype.register.call(this, obj);
    }
    return false;
}

CirelliTinderBot.Listener                    = function(){};
CirelliTinderBot.Listener.prototype          = new sc.IChangeListener();
CirelliTinderBot.Listener.prototype.onLiked  = function(){}
CirelliTinderBot.Listener.prototype.onIdle   = function(){}
CirelliTinderBot.Listener.prototype.onResume = function(){}

module.exports = CirelliTinderBot;