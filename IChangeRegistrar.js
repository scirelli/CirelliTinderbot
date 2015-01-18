//*****************************************
// Author: Steve Cirelli
// File Desc: 
//*****************************************

var Q = require('q');
if( sc === undefined ) var sc = new Object();

!function(sc){
"use strict";
    sc.IChangeListener = function(){};
    sc.IChangeListener.prototype = { 
        onChange:function( ){ }
    }

    sc.IChangePublisher = function(){};
    sc.IChangePublisher.prototype = {
        change:function( obj ){},
        register:function( oListener ){},
        unregister:function( oListener ){},
        registered:function( oListener ){}
    };

    sc.AChangePublisher = function(){
        this.aListeners = new Array();
    }
    sc.AChangePublisher.prototype = new sc.IChangePublisher;

    sc.AChangePublisher.prototype.change = function( ){
        var aListeners = this.aListeners,
            args       = arguments;
        setTimeout(function(){
            for( var i=0, l=aListeners.length,itm=null; i<l; i++ ){
                itm = aListeners[i];
                itm.onChange.apply( itm, args );
            }
        },0);
    },

    sc.AChangePublisher.prototype.register = function( oListener ){
        if( oListener instanceof sc.IChangeListener ){
            this.unregister(oListener);//Items can not be registered more than once
            this.aListeners.push( oListener );
        }else if( oListener instanceof Array ){
            for( var i=0, l=oListener.length; i<l; i++ ){
                this.register( oListener[i] );
            }
        }else{
            throw 'sc.AChangePublisher could not register ' + oListener;
        }
    },

    sc.AChangePublisher.prototype.unregister = function( oListener ){
        if( oListener instanceof sc.IChangeListener ){
            var itm = this.aListeners.indexOf( oListener );
            if(itm < 0 ) return;
            return this.aListeners.splice( itm, 1 );
        }else if( oListener instanceof Array() ){
            for( var i=0, l=oListener.length; i<l; i++ ){
                this.unregister( oListener[i] );
            }
        }
    },

    sc.AChangePublisher.prototype.registered = function( oListener ){
        if( oListener instanceof sc.IChangeListener ){
            var itm = this.aListeners.indexOf( oListener );
            return itm < 0 ? false : true;
        }
        return false;
    }

    sc.AChangePublisherWithDNN = function(){
        sc.AChangePublisher.call(this)
    };
    sc.AChangePublisherWithDNN.prototype = new sc.AChangePublisher();
    sc.AChangePublisherWithDNN.prototype.change = function( obj, oDoNotNotifyThisListener ){
        var defferred = Q.defer();

        function _change( aListeners, index, length, obj, oDoNotNotifyThisListener ){
            for( var i=0, itm=null; index<length && i<10; index++, i++ ){
                itm = aListeners[index];
                if( itm !== oDoNotNotifyThisListener ){
                    try{
                        itm.onChange( obj );
                    }catch(e){
                        console.error(e);
                    }
                }
            }
            if( index < length ){
                setTimeout(function(){
                    defferred.notify( index/length );
                    _change( aListeners, index, length, obj, oDoNotNotifyThisListener );
                }, 1);
            }else{
                defferred.resolve(true);
            }
        };

        _change( this.aListeners, 0, this.aListeners.length, obj, oDoNotNotifyThisListener );

        return defferred.promise;
    }

}(sc);

module.exports = sc;
