var sc = require('./IChangeRegistrar.js');
require('./extras-math.js');

var botTask = {};

void function( botTask ){};
    /**************************************
     * Task Interface for all Tasks
    ***************************************/
    botTask.ITask = function(){};
    botTask.ITask.prototype = {
        run:function(){};
    };
   /***************************************/

    /************************************************************************************************************
     * LikeTask
    *************************************************************************************************************/
    botTask.LikeTask = function( oTinder ){
        this.oTinder = null;

        Object.defineProperty(this, "RECOMMENDATIONS_LIMIT", { get: function(){ return 15; } });

        if( oTinder ){
            this.setTinder(oTinder);
        }

        this.changePub  = new LikeTask.ChangePublisher();
        this.totalCnt   = 0;
        this.likesRemaining = 0;
        this.register   = function(obj){this.changePub.register(obj)};
        this.unregister = function(obj){this.changePub.unregister(obj)};
        Object.defineProperty(this, "LIKE_DELAY", { get: function(){ return ~~Math.rndRange(800,1500); } });
    }
    botTask.LikeTask.prototype = new botTask.ITask();
    botTask.LikeTask.prototype.setTinder = function( oTinder ){
        if( oTinder.getRecommendations ){
            this.oTinder = oTinder;
        }else{
            throw 'botTask.LikeTask.setTinder: requires a tinderjs bot. getRecommendations() method not found.';
        }
    }
    botTask.LikeTask.prototype.run = function(oTinder){
        var me = this;
        var defered = Q.defer();
        this.setTinder(oTinder);
        this.oTinder.getRecommendations(this.RECOMMENDATIONS_LIMIT,function handleResults(error, data){
            if( data && data.results && data.results.length ){
                me.changePub.change({totalCnt:totalCnt+data.results.length, data:data.results});
                me.likeAllRecs( data.results, 0, data.results.length, defered );
            }else{
                defered.resolve(true);
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
                        me.changePub.liked({totalCnt:me.totalCnt, match:e,data:data});
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
                parentDefered.resolve(true);
            }
        ).done();
    }
    botTask.LikeTask.prototype.register = function(oListener){
        this.changePub.register(oListener);
        return this;
    }
    botTask.LikeTask.prototype.unregister = function(oListener){
        this.changePub.unregister(oListener);
        return this;
    }

    LikeTask.ChangePublisher = function(){
        sc.AChangePublisherWithDNN.call(this);
    };
    LikeTask.ChangePublisher.prototype = new sc.AChangePublisherWithDNN();
    LikeTask.ChangePublisher.prototype.liked = function( obj, oDoNotNotifyThisListener ){
        return this._achange('onLiked', obj, oDoNotNotifyThisListener);;
    }
    LikeTask.ChangePublisher.prototype.idle = function( obj, oDoNotNotifyThisListener ){
        return this._achange('onIdle', obj, oDoNotNotifyThisListener);;
    }
    LikeTask.ChangePublisher.prototype.resume = function( obj, oDoNotNotifyThisListener ){
        return this._achange('onResume', obj, oDoNotNotifyThisListener);;
    }
    LikeTask.ChangePublisher.prototype.register = function(obj){
        if( obj.onLiked ){
            return sc.AChangePublisher.prototype.register.call(this, obj);
        }
        return false;
    }

    LikeTask.Listener                    = function(){};
    LikeTask.Listener.prototype          = new sc.IChangeListener();
    LikeTask.Listener.prototype.onLiked  = function(){}
    /************************************************************************************************************/
}(botTask);


module.exports = botTask;
