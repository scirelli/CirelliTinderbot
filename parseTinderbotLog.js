var xhttp = new XMLHttpRequest();
xhttp.open('GET','https://scirelli.com/tinderbot/bots/f49681946b0cf688a17e4734d029354d5571b739_like.log');
xhttp.onreadystatechange = function(){
    if( xhttp.readyState==4 && xhttp.status==200){
        parse(xhttp.responseText);
        //console.log('['+ xhttp.responseText.replace(/,$/,'') +']' );
    }
};
xhttp.send();


function parse( str ){
    var reg = /({[^}]+})/ig;
    var i   = 0;
    //str = str.replace(/}\s*{/g,'},{');
    //str = str.replace(/,$/,'');
    try{
        str = JSON.parse('[' + str + ']' );
        document.body.innerText = 'hi';
        document.body.innerText = JSON.stringify(str);
    }catch(e){
        console.error(e);
        console.log(str.match(/}\s*{/g));
        str = str.replace(/}\s*{/g,'},{');
    }
    /*
    str = str.match(reg);

    try{
        for( l=str.length; i<l; i++ ){
            JSON.parse(str[i]);
        }
        console.log('complete');
    }catch(e){
        console.log(str[i]);
    }
    */
}
