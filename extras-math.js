//------------------------------------------------
// Determins in the parameter is a number
// @param: n - anything
// @return: boolean - true if n is a number false
//          otherwise
//------------------------------------------------
Math.isNumber = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

//------------------------------------------------
// Generates a random number using Math.random()
// in the given range between min and max.
// @param: min - Integer; lower bounds
// @param: max - Integer; upper bounds
// @return: a random number between min and max
//------------------------------------------------
Math.rndRange = function( min, max ){
    if( isNaN(min) || isNaN(max) ) return NaN;
    return Math.random()*(max-min)+min;
}

Math.choose = function( array ){
    return array[ Math.rndRange(0,array.length-1) ];
}

Math.rnd = function(){
    return (Math.rnd.state = (12345 + 1103515245*Math.rnd.state)%0x80000000)/0x80000000;
}

Math.rndSeed = function(seed){
    Math.rnd.state = seed ? seed : (new Date).getTime();
}

Math.rndSeed();
Math.rndRnge = function(  min, max ){
    if( isNaN(min) || isNaN(max) ) return NaN;
    return Math.rnd()*(max-min)+min;
}

//------------------------------------------------
// Converts a byte to a hex number.
// @param: n - number; a number in the range of 
//   0 to 255.
//------------------------------------------------
Math.byte2Hex = function(n) {
    var nybHexString = "0123456789ABCDEF";
    return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
}

Math.toDegrees = function (angle) {
  return angle * (180 / Math.PI);
}
Math.toRadians = function (angle) {
  return angle * (Math.PI / 180);
}
Math.choose = function( array ){
    return array[ Math.randomRange(0,array.length-1) ];
}

Math.EARTH_RADIUS = 3960.00;//in miles

//Spherical Law of Cosines
Math.distance_slc = function( lat1, lon1, lat2, lon2 ){
    var delta_lat = lat2 - lat1,
        delta_lon = lon2 - lon1,
        d         = 0;
    lat1 = Math.toRadians(lat1); 
    lat2 = Math.toRadians(lat2);
    d = Math.sin( lat1 * sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(Math.toRadians(delta_lon)));//missing ) have to look up where it belongs
    d = Math.acos(d);
    d = Math.toDegrees(d);
    d = d * 60 * 1.1515;
    return d;
}

//Haversine Formula
Math.distance_haversine = function( lat1, lon1, lat2, lon2 ){
    var delta_lat = lat2 - lat1,
        delta_lon = lon2 - lon1,
        alpha     = delta_lat/2,
        beta      = delta_lon/2,
        d         = 0,
        a         = 0,
        c         = 0;

    lat1  = Math.toRadians(lat1); 
    lat2  = Math.toRadians(lat2);
    alpha = Math.toRadians(alpha);
    beta  = Math.toRadians(beta);

    a = Math.sin(alpha) * Math.sin(alpha) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(beta) * Math.sin(beta);
    c = Math.asin(Math.min(1, Math.sqrt(a)));
    d = 2*Math.EARTH_RADIUS * c;
    return d;
}
