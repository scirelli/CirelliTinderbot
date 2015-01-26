var Q      = require('q');
var RegExs = require('./regex.js');
var sc     = require('./IChangeRegistrar.js');
require('./extras-math.js');
require('./date.js');

var botTask = {};

void function( botTask ){
    /************************************************************************************************************
     * Task Interface for all Tasks
     ************************************************************************************************************/
    botTask.ITask = function(){};
    botTask.ITask.prototype = {
        run:function(){},
        setSharedData:function(){},
        onIdle:function(){},
        onResume:function(){}
    };
    /************************************************************************************************************/

    /************************************************************************************************************
     * ATask
    *************************************************************************************************************/
    botTask.ATask = function( oTinder ){
        this.oTinder     = null;
        this.oSharedData = {};
        if( oTinder ){
            this.setTinder(oTinder);
        }

        this.changePub  = new botTask.ATask.ChangePublisher();
    };
    botTask.ATask.prototype = new botTask.ITask();
    botTask.ATask.prototype.setTinder = function( oTinder ){
        if( oTinder ){
            this.oTinder = oTinder;
        }else{
            throw 'botTask.ATask.setTinder: requires a tinderjs bot.';
        }
    }
    botTask.ATask.prototype.setSharedData = function( oSharedData ){
        this.oSharedData = oSharedData;
        return this;
    }
    botTask.ATask.prototype.register = function(oListener){
        this.changePub.register(oListener);
        return this;
    }
    botTask.ATask.prototype.unregister = function(oListener){
        this.changePub.unregister(oListener);
        return this;
    }
    botTask.ATask.prototype.onChange = function(obj){
        this.change(obj);
        return this;
    }
    botTask.ATask.prototype.change = function(obj){
        this.changePub.change(oListener);
        return this;
    }
    botTask.ATask.prototype.onIdle = function(obj){
        this.idle(obj);
        return this;
    }
    botTask.ATask.prototype.idle = function(obj){
        this.changePub.idle(obj);
        return this;
    }

    botTask.ATask.ChangePublisher = function(){
        sc.AChangePublisherWithDNN.call(this);
    };
    botTask.ATask.ChangePublisher.prototype = new sc.AChangePublisherWithDNN();
    botTask.ATask.ChangePublisher.prototype.idle = function( obj, oDoNotNotifyThisListener ){
        return this._achange('onIdle', obj, oDoNotNotifyThisListener);
    }
    botTask.ATask.ChangePublisher.prototype.resume = function( obj, oDoNotNotifyThisListener ){
        return this._achange('onResume', obj, oDoNotNotifyThisListener);
    }
    botTask.ATask.ChangePublisher.prototype.register = function(obj){
        if( obj.onLiked && obj.onIdle && obj.onResume ){
            return sc.AChangePublisher.prototype.register.call(this, obj);
        }
        return false;
    }

    botTask.ATask.Listener                    = function(){};
    botTask.ATask.Listener.prototype          = new sc.IChangeListener();
    botTask.ATask.Listener.prototype.onIdle   = function(){}
    botTask.ATask.Listener.prototype.onResume = function(){}
    /************************************************************************************************************/

    /************************************************************************************************************
     * LikeTask
    *************************************************************************************************************/
    botTask.LikeTask = function( oTinder ){
        //Call parent constructor
        botTask.ATask.call(this, oTinder);
        Object.defineProperty(this, "RECOMMENDATIONS_LIMIT", { get: function(){ return 15; } });


        this.changePub  = new botTask.LikeTask.ChangePublisher();
        this.totalCnt   = 0;
        this.likesRemaining = 0;
        Object.defineProperty(this, "LIKE_DELAY", { get: function(){ return ~~Math.rndRange(800,1500); } });
    }
    botTask.LikeTask.prototype = new botTask.ATask();
    botTask.LikeTask.prototype.setTinder = function( oTinder ){
        if( oTinder.getRecommendations ){
            this.oTinder = oTinder;
        }else{
            throw 'botTask.LikeTask.setTinder: requires a tinderjs bot. getRecommendations() method not found.';
        }
    }
    botTask.LikeTask.prototype.setSharedData = function( oSharedData ){
        this.oSharedData = oSharedData;
        return this;
    }
    botTask.LikeTask.prototype.run = function(oTinder, oSharedData){
        var me = this;
        var defered = Q.defer();
        this.setTinder(oTinder);
        this.oTinder.getRecommendations(this.RECOMMENDATIONS_LIMIT,function handleResults(error, data){
            if( data && data.results && data.results.length ){
                me.changePub.change({totalCnt:me.totalCnt+data.results.length, data:data.results, oTinder:oTinder});
                me.likeAllRecs( data.results, 0, data.results.length, defered );
            }else{
                me.changePub.change({totalCnt:me.totalCnt, data:[], error:data});
                defered.reject({ data:data, task:me });
            }
        });
        return defered.promise;
    }
    botTask.LikeTask.prototype.likeAllRecs = function( aRecs, index, sz, parentDefered ){
        var me = this;
        void function loop( a, index, sz ){
            var defered = Q.defer();
            if( index >= sz ){
                defered.reject({error:'Done', a:a, index:index, sz:sz});
            }else{
                var e = a[index];
                me.totalCnt++;

                me.oTinder.like(e._id,function(error, data){
                    if( error ){
                        debugger;
                        defered.reject({error:error, data:data, a:a, index:index, sz:sz});
                    }else{
                        me.likesRemaining = data.likes_remaining;
                        me.changePub.liked({totalCnt:me.totalCnt, match:e, data:data, oTinder:me.oTinder});
                        defered.resolve({error:error, data:data, a:a, index:index, sz:sz});
                    }
                });
            }
            return defered.promise;
        }( aRecs, index, sz ).delay(me.LIKE_DELAY).then(
            function resolve0(result){
                return me.likeAllRecs( result.a, result.index+1, result.sz, parentDefered );
            },
            function reject0(){
                parentDefered.resolve({task:me});
            }
        ).done();
    }
    botTask.LikeTask.prototype.register = function(oListener){
        if( oListener && oListener.onLike ){
            botTask.ATask.prototype.register.call(this,oListener);
        }
        return this;
    }
    botTask.LikeTask.prototype.onLike = function(obj){
        this.liked(obj);
        return this;
    }
    botTask.LikeTask.prototype.liked = function(obj){
        this.changePub.liked(obj);
        return this;
    }

    botTask.LikeTask.ChangePublisher = function(){
        sc.AChangePublisherWithDNN.call(this);
    };
    botTask.LikeTask.ChangePublisher.prototype = new botTask.ATask.ChangePublisher();
    botTask.LikeTask.ChangePublisher.prototype.liked = function( obj, oDoNotNotifyThisListener ){
        return this._achange('onLiked', obj, oDoNotNotifyThisListener);
    }

    botTask.LikeTask.Listener                    = function(){};
    botTask.LikeTask.Listener.prototype          = new botTask.ATask.Listener();
    botTask.LikeTask.Listener.prototype.onLiked  = function(){}
    /************************************************************************************************************/

    /************************************************************************************************************
     * FilterSpamTask
    *************************************************************************************************************/
    botTask.FilterSpamTask = function( oTinder ){
        //Call parent constructor
        botTask.ATask.call(this, oTinder);
        this.totalCnt = 0;
        Object.defineProperty(this, "SCAN_LIMIT", { get: function(){ return 4; } });//Scan the first X messages from a user for spam. 0 means all. If spam not found in X msgs there's no spam.
        Object.defineProperty(this, "SCAN_DELAY", { get: function(){ return ~~Math.rndRange(500,1000); } });
        this.phoneNumberParser = new RegExs.phoneNumberParser();
    }
    botTask.FilterSpamTask.prototype = new botTask.ATask();
    botTask.FilterSpamTask.prototype.setTinder = function( oTinder ){
        if( oTinder.getUpdates ){
            this.oTinder = oTinder;
        }else{
            throw 'botTask.FilterSpamTask.setTinder: requires a tinderjs bot. getUpdates() method not found.';
        }
    }
    botTask.FilterSpamTask.prototype.run = function( oTinder ){
        var me = this;
        var defered = Q.defer();
        this.setTinder(oTinder);
        this.oTinder.getUpdates(function handleResults(error, data){
            //console.log(JSON.stringify(data));
            if( data && data.matches && data.matches.length ){
                me.changePub.change({totalCnt:me.totalCnt+data.matches.length, data:data.matches, oTinder:me.oTinder});
                me.filterAllMatches( data.matches, defered );
            }else{
                me.changePub.change({totalCnt:me.totalCnt, data:[], error:data});
                defered.reject({ data:data, task:me });
            }
        });
        return defered.promise;
    }
    botTask.FilterSpamTask.prototype.filterAllMatches_Not_used = function( aMatches, index, sz, parentDefered ){
        var me = this;
        void function loop( a, index, sz ){
            var defered = Q.defer();
            if( index >= sz ){
                defered.reject({error:'Done', a:a, index:index, sz:sz});
            }else{
                var match    = a[index],
                    messages = match.messages || [],
                    myId     = me.oTinder.userId,
                    limit    = me.SCAN_LIMIT > 0 ? me.SCAN_LIMIT : messages.length;

                me.totalCnt++;
                
                //Probably don't need to do this sort. Messages seem to be in order
                messages.sort(function(a,b){
                    return Date.compare( new Date(a.sent_date), new Date(b.sent_date) );
                });
                for( var i=0,l=messages.length,msg=null; i<l && i<=limit; i++ ){
                    msg = messages[i];
                    if( msg.to === myId ){//If the message is to me scan it.
                        debugger;
                        me.isSpam(msg.message).then(
                            function itIsSpam(){
                                //report it.
                                me.reportSpam( match, msg );
                            },
                            function notSpam(){
                                //do nothing
                            }
                        );
                        break;
                    }
                }
                debugger;
                defered.resolve({a:a, index:index, sz:sz});
            }
            return defered.promise;
        }( aMatches, index, sz ).delay(me.SCAN_DELAY).then(
            function resolve0(result){
                return me.filterAllMatches( result.a, parentDefered );
            },
            function reject0(){
                parentDefered.resolve({task:me});
            }
        ).done();
    }

    botTask.FilterSpamTask.prototype.filterAllMatches = function( aMatches, parentDefered ){
        var me   = this,
            myId = me.oTinder.userId;

        aMatches.forEach(function( oMatch, index ){
            var aMessages = oMatch.messages || [],
                nLimit    = me.SCAN_LIMIT > 0 ? me.SCAN_LIMIT : aMessages.length;

            me.totalCnt++;
            
            //Probably don't need to do this sort. Messages seem to be in order
            aMessages.sort(function(a,b){
                return Date.compare( new Date(a.sent_date), new Date(b.sent_date) );
            });
            for( var i=0,l=aMessages.length,oMsg=null; i<l && i<=nLimit; i++ ){
                oMsg = aMessages[i];
                if( oMsg.to === myId ){//If the message is to me scan it.
                    me.isSpam(oMsg.message).then(
                        function itIsSpam(){
                            //report it.
                            me.reportSpam( oMsg.from ).then(
                                function spamResolved( response ){
                                    me.spam({ oMatch:oMatch, oMsg:oMsg });
                                },
                                function spamRejected( reason ){;
                                }
                            ).done();
                        },
                        function notSpam(){
                            //do nothing
                        }
                    ).done();
                }
            }
        });
        parentDefered.reject( {error:'Sleep.', task:me} );//reject to sleep
    }
    botTask.FilterSpamTask.prototype.isSpam = function( msg ){
        var defered = Q.defer();
        if( RegExs.regURL.test(msg) ){
            defered.resolve(true);
        }else if( this.phoneNumberParser.parse(msg).hasNumbers() ){
            defered.resolve(true);
            this.phoneNumberParser.clear();
        }else{
            defered.reject(false);
        }
        return defered.promise;
    }
    botTask.FilterSpamTask.prototype.reportSpam = function( userId ){
        var me = this,
            defered = Q.defer();

        this.oTinder.report( userId, this.oTinder.REPORT_CAUSE_SPAM, function( error, data ){
            if( error ){
                defered.reject( {error:error, data:data} );
            }else{
                defered.resolve( {error:error, data:data} );
            }
        });
        return defered.promise;
    }
    botTask.FilterSpamTask.prototype.register = function(oListener){
        if( oListener && oListener.onSpam ){
            botTask.ATask.prototype.register.call(this,oListener);
        }
        return this;
    }
    botTask.FilterSpamTask.prototype.spam = function( obj ){
        this.changePub.spam(obj);
        return this;
    }

    botTask.FilterSpamTask.ChangePublisher = function(){
        sc.AChangePublisherWithDNN.call(this);
    };
    botTask.FilterSpamTask.ChangePublisher.prototype      = new botTask.ATask.ChangePublisher();
    botTask.FilterSpamTask.ChangePublisher.prototype.spam = function( obj, oDoNotNotifyThisListener ){
        return this._achange('onSpam', obj, oDoNotNotifyThisListener);
    }

    botTask.FilterSpamTask.Listener                    = function(){};
    botTask.FilterSpamTask.Listener.prototype          = new botTask.ATask.Listener();
    botTask.FilterSpamTask.Listener.prototype.onSpam   = function(){}
    /************************************************************************************************************/
}(botTask);


module.exports = botTask;
