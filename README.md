nd-server
=========

Hutia's quick node server.

Based on Connect / Express / Socket.IO (under development) / sqlite3

Has its' own page render engine: HUT.

Feathers:

1. Easy to config.

2. Extensible.


Usage

	// import module
	var hutia = require('hutia');

	// create application
	// note it's inherited from express and it has all behaviors as express()
	// except app.engine is overrided
	var app = hutia();

	// set logger option
	// if this option is not set, the logger will not take effect
	app.set('logger', 'dev');

	// set session options
	// if this option is not set, the session will not take effect
	app.set('session', { secret: 'hutia-secret', cookie: { maxAge: 60 * 60 * 1000 }});

	// set database path
	// this database is inherited from node-sqlite3
	app.set('dbpath', './hutia/test/db/mydb.db');

	// set the root path of web site
	app.root = './hutia/test/www';

	// set listen port
	// default as 80
	app.port = 80;
	
	// start server
	app.start(function(){
		console.log('server is running...');
	});


HUT engine
----------

An EJS-liked server-based engine.

Use it to render page on server side.

Feathers:

1. <? javascript code runs here ?>

2. include

		include('header.hut', [optionObjects]);
	
3. MODU

		MODU SOME_MODULES.hut


This is only a draft document, to be continued...