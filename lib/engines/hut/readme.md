HUT Engine
============


## Usage:

		render(req, res, next, {'app':app, 'server':server, 'config':config})


## APIs


1. MODU path;

	Include the specified file during the COMPILE stage.

	note that the path can be a string format, or even only a simple literal text.

	note that the file extension "hut" can be omitted.

	code example:

			MODU ./inc/conn.hut;
			MODU "./inc/conn.hut";
			MODU ./inc/conn;

		
		
2. include(path, [options]);

	include the specified file during RUNTIME.

	note that this is a inner JS function implemented by this engine.

	note that the file extension "hut" can be omitted.

	code example:

			include('./conn.hut');
			include('./head.hut', {title:'my title'});
			

		
3. GET / POST / CONFIG

	a javascript object for request shotcuts


4. session / removeSession


5. echo / asynEchoPrepare / asynEcho