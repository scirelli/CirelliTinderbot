debugger;
var LIKE_DELAY  = 500;
var NO_RESULTS_DELAY = 15*60*1000;//15mins

var Q       = require('q');
var tinder  = require('tinderjs');
var request = require('request');

var tin              = new tinder.TinderClient();
var cnt              = 0;
var likesRemaining   = 100;
var tinderToken      = '28f78acd-8fd9-4cbf-9e6e-8a27adaf066b';
var userId           = '587466835';
var fbTokenExpiresIn = new Date(new Date().getTime() - 60 * 20 * 1000);//some time in the past;

tin.setAuthToken(tinderToken);

//process.argv[0];
function run(){
    getFBAccessToken().then(function(fbToken){
    });;
    return;
    tin.getRecommendations(10,function handleResults(error, data){
        debugger;
        if( data && data.results && data.results.length ){
            likeAllRecs( data.results, 0, data.results.length );
        }else{
            console.log('No one left to like!');
            console.log(data);
            Q.delay(NO_RESULTS_DELAY).then(function(){
                run();
            });
        }
    });
}

function likeAllRecs( aRecs, index, sz ){
    void function loop( a, index, sz ){
        var e       = a[index];
        var defered = Q.defer();
        console.log('******** ' + cnt++ + ' **********\n' + e.name + '\n\t' + e._id + '\n\t' + e.distance_mi + ' miles away.\n********************\n\n\n');
        
        if( index >= sz ){
            debugger;
            defered.reject({error:error, data:data, a:a, index:index, sz:sz});
        }else{
            tin.like(e._id,function(error, data){
                if( error ){
                    debugger;
                    defered.reject({error:error, data:data, a:a, index:index, sz:sz});
                }else{
                    likesRemaining = data.likes_remaining;
                    defered.resolve({error:error, data:data, a:a, index:index, sz:sz});
                }
            });
        }
        return defered.promise;
    }( aRecs, index, sz ).delay(LIKE_DELAY).then(
        function resolve0(result){
            debugger;
            return likeAllRecs( result.a, result.index+1, result.sz );
        },
        function reject0(){
            debugger;
            run();
        }
    );
}

//https://www.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=public_profile,user_friends,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token
function getFBAccessToken(){
    var defered = Q.defer();
    var opts = {
        url:'https://www.facebook.com/dialog/oauth?client_id=464891386855067&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=public_profile,user_friends,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token',
        method:'GET',
        followAllRedirects:false,
        headers:{
            'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
            'Cookie':'datr=lzj_U8fjKk6fRDpKJ0T_1Gp2; lu=RA-kIgLyZpFYVFsLDxsKs2BA; x-referer=%2Fphoto.php%3Ffbid%3D10100941470926828%26id%3D31701236%26set%3Decnf.31701236%26source%3D49%26refid%3D17%23%2Fvictoria.smutek%3Ffref%3Dfc_search; p=-2; a11y=%7B%22sr%22%3A0%2C%22sr-ts%22%3A1413504846990%2C%22jk%22%3A0%2C%22jk-ts%22%3A1413504846990%2C%22kb%22%3A2%2C%22kb-ts%22%3A1421517595971%2C%22hcm%22%3A0%2C%22hcm-ts%22%3A1413504846990%7D; act=1421556250968%2F35; c_user=587466835; fr=0YoDriSSxk9MRqY8k.AWUUP07SJhtyOFxh5Lv3qy7ZGs0.BT_zlN.Zu.FS5.0.AWVI8wDO; xs=51%3AYWCBKuSX3oSgyQ%3A2%3A1409235277%3A15982; csm=2; s=Aa5ln5gAdKe1KObk.BUuUzK; presence=EM421594477EuserFA2587466835A2EstateFDsb2F1421258931559Et2F_5b_5dElm2FnullEuct2F1421516969BEtrFnullEtwF1831488597EatF1421594121767G421594477312CEchFDp_5f587466835F17CC'
        }
    };
    request(opts,function( error, res, body ){
        var access_token     = '',
            expiryInSeconds  = '';

        fbTokenExpiresIn = new Date(new Date().getTime() - 60 * 20 * 1000);//some time in the past;

        debugger;
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

//curl -X POST --cookie-jar cookies.txt -D authHeaders.txt -A "Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19" --data "facebook_token=CAAGm0PX4ZCpsBABkxZAHffqphpZBfzU3elGWkQuwPJ1ZBvjzJJBIiB1dB9MBmAWLVS12vnzFZBDVQNp1HX1zmqAZCZBUPlVDlQ1CHJQZCRFVRhQfvYLlB8gLhBPJgre594mrhxrVZBOaY98VDyvZAbvSNZCUgfDS4riQSIF4WstGzkMGVxkjJBhqg0lOvg1ZBjx0lLVZB5eUgMUkotNzqDO3iFwZAD4NkhqsBEYZCwZD&facebook_id=587466835" "https://api.gotinder.com/auth"
function tinderAuth( fbToken, userId ){
    var defered = Q.defer();
    tin.authorize( fbToken, userId, function(){
        defered.resolve(true);
    });
}

function isfbTokenExpired(){
    if( new Date().getTime() >= fbTokenExpiresIn.getTime() ){
        return true;
    }
    return false;
}








/*****************
 * Bot start      
 * ***************/
run();

//bot.FBClientId       = "341894202663638";
//bot.FBClientSecret   = "f97be0d4d37e8d856687725d43318e5d";
//bot.port             = 8787;
//bot.redirectURI      = '192.168.1.18';

/*bot.mainLoop = function() {
    console.log('Looping');
    bot.client.getRecommendations(10, function(error, data){
        if( data && data.message === "recs timeout" ){
            console.log('Recommendations timeout');
            return;
        }
        _.chain(data.results)
        .pluck('_id')
        .each(function(id){
            bot.client.like(id, function(error, data) {
                cnt++;
                console.log('Count: ' + cnt);
                if( data && data.matched ){
                    console.log('MATCHED!');
                    //bot.client.sendMessage( id, "" );
                }
            });
        });
    });
};
*/

//bot.live();
//https://www.facebook.com/dialog/oauth?client_id=341894202663638&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=basic_info,email,public_profile,user_about_me,user_activities,user_birthday,user_education_history,user_friends,user_interests,user_likes,user_location,user_photos,user_relationship_details&response_type=token
