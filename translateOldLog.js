var fs = require('fs');

fs.readFile('bots/f49681946b0cf688a17e4734d029354d5571b739_like_new.log',{encoding:'utf8'},function(err,data){
    data = data.split('\n');
    var output = [];
    data.forEach(function(e,i){
        if( e ){
            var o = {};
            e = e.replace(/">Image_\d+\<\/a>,\<a href="/g,',').replace('<a href="','').replace(/">Image_\d+\<\/a>/g,'');
            e = e.split(' ');
            e[1] = e[1].split('(');
            e[1][1] = e[1][1].replace(')','');
            o.name = e[1][0];
            o.mId  = e[1][1];

            o.d = e[2];

            e[5] = e[5].split(',');
            o.imgs = e[5];
            //console.log(e[5]);
            //console.log(JSON.stringify(o));
            output.push(JSON.stringify(o));
        }
    });
    output = output.join(',');
    fs.writeFile('bots/f49681946b0cf688a17e4734d029354d5571b739_like_new2.log',output, {encodeing:'utf8'}, function(err){
        console.log(err);
    });
});
