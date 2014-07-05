var hutia = require('../index');

var app = hutia();

app.set('logger', 'dev');

app.set('session', { secret: 'hutia-secret', cookie: { maxAge: 60 * 60 * 1000 }});

app.set('dbpath', './hutia/test/db/mydb.db');

app.root = './hutia/test/www';

app.start(function(){
	console.log('server is running...');
});