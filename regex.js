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
    regURLSimple:/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i,
    PhoneNumberParser:function(){
        var minimum = 9;            // typical minimum phone number length
        this.items = [];

        var public = PhoneNumberParser.prototype;
        public.parse = function(str) {
            var items = this.items = [];

            var i = 0, n = '', min = minimum;

            while(i < str.length) {
                switch(str[i]) {
                case '+':                                   // start of international number
                    if (n.length >= min) items.push(n);
                    n = str[i];
                    min = minimum + 2;                      // at least 2 more chars in number
                    break;
                case '-': case '.': case '(': case ')':     // ignore punctuation
                    break;
                case ' ':
                    if (n.length >= min) {              // space after consuming enough digits is end of number
                        items.push(n);
                        n = '';
                    }
                    break;
                default:
                    if (str[i].match(/[0-9]/)) {            // add digit to number
                        n += str[i];
                        if (n.length == 1 && n != '0') {
                            min = 3;                        // local number (extension possibly)
                        }
                    } else {
                        if (n.length >= min) {
                            items.push(n);                  // else end of number
                        }
                        n = '';
                    }
                    break;
                }
                i++;
            }

            if (n.length >= min) {              // EOF
                items.push(n);
            }
        }
    }
}
