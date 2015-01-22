module.exports = {
    //var oRegEx = /^(https?):\/\/(([a-z0-9$_\.\+!\*\'\(\),;\?&=-]|%[0-9a-f]{2})+(:([a-z0-9$_\.\+!\*\'\(\),;\?&=-]|%[0-9a-f]{2})+)?@)?(?#)((([a-z0-9][a-z0-9-]*[a-z0-9]\.)*[a-z][a-z0-9-]*[a-z0-9]|((\d|[1-9]\d|1\d{2}|2[0-4][0-9]|25[0-5])\.){3}(\d|[1-9]\d|1\d{2}|2[0-4][0-9]|25[0-5]))(:\d+)?)(((\/+([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)*(\?([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)?)?)?(#([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)?$/ig;
     /*http://forums.devshed.com/javascript-development-115/regexp-to-match-url-pattern-493764.html */
    regURL:new RegExp('((https?):\/\/)?' +                 // protocol||
        '('+
        '([a-z0-9$_\.\+!\*\'\(\),;\?&=-]|%[0-9a-f]{2})+' +         // username
        '(:([a-z0-9$_\.\+!\*\'\(\),;\?&=-]|%[0-9a-f]{2})+)?' +     // password
        '@)?'+                                                     // auth requires @
        '('+
           '('+
               '([a-z0-9][a-z0-9-]*[a-z0-9]\.)*' +                     // domain segments AND
               '[a-z][a-z0-9-]*[a-z0-9]' +                                // top level domain  OR
               '|((\d|[1-9]\d|1\d{2}|2[0-4][0-9]|25[0-5])\.){3}' +
               '(\d|[1-9]\d|1\d{2}|2[0-4][0-9]|25[0-5])' +                // IP address
           ')'+
            '(:\d+)?' +                                             // port
        ')'+
        '('
           +'('+
               '(\/+([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)*'+ // path
               '(\\?([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)' +     // query string
           '?)'+
           '?'+
        ')?' +                                                  // path and query string optional
        '(#([a-z0-9$_\.\+!\*\'\(\),;:@&=-]|%[0-9a-f]{2})*)?'     // fragment
        ,'ig'),
        //http://stackoverflow.com/questions/8188645/javascript-regex-to-match-a-url-in-a-field-of-text
        //var oRegEx = new RegExp("(http|ftp|https)://[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?");
    regURLSimple:/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
}
