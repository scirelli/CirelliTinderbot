var Q       = require('q');
var fs      = require('fs');
var tinder  = require('./tinder.js');
var request = require('request');
var sc      = require('./IChangeRegistrar.js');
var task    = require('./botTask.js');
require('./extras-math.js');

function CirelliTinderBot(){
"use strict";
    var NO_RESULTS_DELAY      = 15*60*1000;                                //15mins

    var tin              = new tinder.TinderClient();
    var userId           = '';                                             //Get it here http://findmyfacebookid.com/
    var cookie           = '';                                             //FB cookie: Open your favorite browser and JS debugger and do a window.document.cookie
    var fbTokenExpiresIn = new Date(new Date().getTime() - 60 * 20 * 1000);//some time in the past;
    var me               = this;
    var bRun             = true;
    var changePub        = new CirelliTinderBot.ChangePublisher();
    var aTasks           = [];
    var defAuthorize     = Q.defer();
    var oSharedData      = { getMyTinderId:getMyTinderId };
    var sMyTinderId      = '';

    function run(){
        if( !userId && !cookie ){
            throw 'Need to set userId and cookie first.';
        }

        aTasks.forEach(function(e,index){
            e.setSharedData( oSharedData );
            runTask(e,tin);
        });
    }

    function runTask( t, tin ){
        if( bRun ){
            authenticate().then(
                function authenticateResolve(){
                    t.run(tin).then(
                        function taskResolve(){
                            runTask(t,tin);
                        },
                        function taskReject( reason ){
                            changePub.idle( {reason:reason, idleTime:NO_RESULTS_DELAY} );
                            Q.delay(NO_RESULTS_DELAY).then(function(){
                                changePub.resume( reason );
                                runTask(t,tin);
                            });
                        }
                    ).done();
                },
                function authenticateReject(){
                    throw 'Unable to authenticate.';
                }
            ).done();
        }
    }

    function authenticate(){
        if( isFBTokenExpired() ){
            fbTokenExpiresIn = new Date(new Date().getTime() + 10000);//some time in the future. Will be over written by the actual time. 
            defAuthorize = authorize();
        }
        return defAuthorize;
    }
    function authorize(){
        var defered = Q.defer();
        getFBAccessToken().then(function(fbToken){
            tin.authorize(fbToken, userId, function( response ){
                if( response && response.error ){
                    defered.reject({authorized:false, error:response.error});
                }else{
                    sMyTinderId = response.userId;
                    console.log( 'My tinder userid: ' + sMyTinderId + '\nAuthToken: ' + response.xAuthToken);
                    //console.log(JSON.stringify(response));
                    defered.resolve({authorized:true});
                }
            });
        }).done();
        return defered.promise;
    }
    function getMyTinderId(){
        return sMyTinderId;
    }
    function getFBAccessToken(){
        var defered = Q.defer();
        var opts = {
            url:'https://www.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=public_profile,user_friends,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token',
            method:'GET',
            followAllRedirects:false,
            headers:{
                'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
                'Cookie':cookie.trim()
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
        return this;
    }
    this.log = function( str ){
        console.log(str);
        return this;
    }
    this.addTask = function( oTask ){
        if( oTask && oTask.run && oTask.setSharedData ){
            aTasks.push(oTask);
        }
        return this;
    };
    this.removeTask = function( oTask ){
        var i = aTasks.indexOf(oTask);
        if( i >= 0 ){
            aTasks.splice(i,1);
        }
        return this;
    };
    this.setUserId = function(usrId){
        userId = usrId;
        return this;
    };
    this.setFBCookie = function(fbCookie){
        cookie = fbCookie;
        return this;
    };
    this.register = function( obj ){
        changePub.register(obj);
        return this;
    };
    this.unregister = function( obj ){
        changePub.unregister(obj);
        return this;
    };
    this.start = function( fbCookie, usrId ){
        this.setFBCookie( fbCookie || CirelliTinderBot.getFBCookieFromFile());
        this.setUserId( usrId || CirelliTinderBot.getUserIdFromCookie(cookie) );
        bRun = true;
        run();
        return this;
    };
    this.stop = function(){
        bRun = false;
    };
}

CirelliTinderBot.getUserIdFromFile = function(fileName){
    fileName = fileName || 'userid.txt';
    try{
        return fs.readFileSync('userid.txt', 'utf-8');//Get userid from http://findmyfacebookid.com/
    }catch(e){}
    return '';
}
CirelliTinderBot.getUserIdFromCookie = function( sCookie ){
    var regexUserId = /c_user=(\d+);/; //c_user=587466835;
    var a           = regexUserId.exec(sCookie);
    if( a && a.length > 1 ){
        return a[1];
    }
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
CirelliTinderBot.ChangePublisher.prototype.idle = function( obj, oDoNotNotifyThisListener ){
    return this._achange('onIdle', obj, oDoNotNotifyThisListener);
}
CirelliTinderBot.ChangePublisher.prototype.resume = function( obj, oDoNotNotifyThisListener ){
    return this._achange('onResume', obj, oDoNotNotifyThisListener);
}
CirelliTinderBot.ChangePublisher.prototype.register = function(obj){
    if( obj.onIdle && obj.onResume ){
        return sc.AChangePublisher.prototype.register.call(this, obj);
    }
    return false;
}

CirelliTinderBot.Listener                    = function(){};
CirelliTinderBot.Listener.prototype          = new sc.IChangeListener();
CirelliTinderBot.Listener.prototype.onIdle   = function(){}
CirelliTinderBot.Listener.prototype.onResume = function(){}

module.exports = CirelliTinderBot;
