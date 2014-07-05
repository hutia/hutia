
// import utils
var fs = require('fs');

var START = '<?';
var END = '?>';

var STARTreg = START.replace(/(\W)/g, '\\$1');
var ENDreg = END.replace(/(\W)/g, '\\$1');

function addSlash(v) {
	return String(v).replace(/\\/g, '\\\\').replace(/\'/g, '\\\'').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

/*
 * render
 * this is the exported render method
 */
function render(req, res, next, app){
	var filepath = app.resolve(req.path);
	var cache = {}; // IO cache
	var cache2 = {}; // compile cache
	var closed = false;
	
	_render(filepath, null, function(err, data){
		if (err) return exit(500, err);
		exit(200, data);
	});
	
	/* exit
	 * @param {Number} code
	 * @param {String} body
	 */
	function exit(code, body){
		closed = true;
		res.send(code, body);
		res.end();
	}
	
	/* getContent
	 * @param {String} filepath
	 * @param {Function} callback({String} data)
	 * get content from specified file path
	 * deal with error automatically
	 * cache file content automatically
	 */
	function getContent(filepath, callback){
		if (closed) return;
		if (cache[filepath]) {
			callback(cache[filepath]);
		} else {
			fs.readFile(filepath, app.get('charset') || 'utf-8', function(err, data){
				if (err) return exit(500, err);
				cache[filepath] = data;
				callback(data);
			});
		}
	}
	
	/* compile
	 * @param {String} data
	 * @param {Function} callback({String} code)
	 * statically compile the source data into script format
	**/
	function compile(data, filepath, callback){
		if (closed) return;
		if (cache2[data]) return callback(cache2[data]);
		
		var asynCount = 0;
		
		// pre-treatment
		var re = END + data + START;
		
		// treat <?= expression ;?>
		re = re.replace(new RegExp(STARTreg + '\\s*=\\s*([\\w\\W]+?)' + ENDreg, 'g'), function(all, v){
			return START + 'echo(' + v.replace(/\s*;\s*$/, '') + ');' + END;
		});
		
		// treat content out of <? ?>
		re = re.replace(new RegExp(ENDreg + '([\\w\\W]*?)' + STARTreg, 'g'), function(all, v){
			return v?'echo(\'' + addSlash(v) + '\');':'';
		});
		
		// treat module
		// Syntax: ^MODU path;$
		re = re.replace(/^\s*MODU\s+([\s\S]+?)$/gm, function(all, v){
			// create random id for further replacement
			var rid = (new Date()).getTime().toString(36) + ((Math.random() * 0xffffff) | 0).toString(36) + ((Math.random() * 0xffffff) | 0).toString(36);
			// treat resource parameter
			v = v.replace(/\s*;\s*$/, '').replace(/^\s+/, '').replace(/\s+$/, '');
			v = /^[\'\"]/.test(v) ? v.substring(1, v.length - 1) : v;
			// treat omitted file extension
			if (!/\.hut$/i.test(v)) v = v + '.hut';
			// resolve path
			var src = app.resolve(filepath.replace(/[\\\/][^\\\/]*$/,''), v);
			// record asyn tasks
			asynCount++;
			getContent(src, function(data){
				compile(data, src, function(code){
					// decrease count of asyn tasks
					asynCount--;
					// replace rid with code
					// and also record path information
					re = re.replace(rid, code);
					// check if all asyn tasks've been completed
					complete();
				});
			});
			// put rid for further replacement
			return rid;
		});
		
		complete();
		
		// complete
		function complete(){
			if (asynCount <= 0){
				cache2[data] = re;
				callback(re);
			}
		}
	}
	
	/* run
	 * @param {String} code
	 * @param {Object} options
	 * @param {String} filepath
	 * @param {Function} callback ({Object} err, {String} data)
	 * run specified code with given options
	**/
	function run(code, options, filepath, callback){
		if (closed) return;
		
		var names = [], values = [];
		var fn;
		var output = [];
		var pathStack = [];
		var asynCount = 0;
		
		// check options
		if (!options) options = {};
		
		// internal methods
		var _options = {
			echo : echo, // just print out the content to client
			asynEchoPrepare : asynEchoPrepare,
			asynEcho : asynEcho,
			include : include, // include the specified file as HUT file
			require : _require, // the same as <require> in node, just fix the file path
			request : req,
			session : session,
			removeSession : removeSession,
			GET : req.query,
			POST : req.body,
			SERVER : app
		};
		
		// will NOT override if already exists in options
		for (var i in _options) if (typeof options[i] === 'undefined') options[i] = _options[i];
		
		// prepare options
		for (var name in options){
			names.push('\'' + addSlash(name) + '\'');
			values.push(options[name]);
		}
		
		// prepare function
		if (names.length === 0) fn = 'fn = new Function(\'' + addSlash(code) + '\');';
		else fn = 'fn = new Function(' + names.join(', ') + ', \'' + addSlash(code) + '\');';
		
		// create function
		try {
			eval(fn);
		} catch(e) {
			console.log('err: '+e);
			console.log('run-1: ' + fn);
			return callback(e);
		}
		
		// execute code
		try {
			fn.apply(this, values);
		} catch(e) {
			console.log('err: ' + e);
			console.log('run-2:' + fn);
			return callback(e);
		}
		
		complete();
		
		// complete
		function complete(){
			if (asynCount <= 0) callback(null, output.join(''));
		}
		
		/* below functions for code internal usage */
		function echo(s){
			output.push(s);
		}
		
		function asynEchoPrepare(){
			asynCount++;
			var i = output.length;
			output.push('');
			return i;
		}
		
		function asynEcho(pin, data){
			asynCount--;
			output[pin] = String(data);
			complete();
		}
		
		function absPath(src, autoExt){
			if (autoExt && !/\.hut$/i.test(src)) src = src + '.hut';
			return app.resolve(filepath.replace(/[\\\/][^\\\/]*$/,''), src);
		}
		
		function include(src, options){
			var src = absPath(src, true);
			var pin = asynEchoPrepare();
			_render(src, options, function(err, data){
				if (err) return exit(500, err);
				asynEcho(pin, data);
			});
		}
		
		function _require(s){
			try {
				return require(s);
			} catch(e) {
				return require(absPath(s));
			}
		}
		
		function session(name, value){
			if (arguments.length == 2) req.session[name] = value;
			else return req.session[name];
		}
		
		function removeSession(name){
			delete req.session[name];
		}
		
		
	}
	
	/* _render
	 * @param {String} filepath
	 * @param {function} callback({String} output)
	 * render the content from given file path
	**/
	function _render(filepath, options, callback){
		if (closed) return;
		
		getContent(filepath, function(data){
			compile(data, filepath, function(code){
				run(code, options, filepath, callback);
			});
		});
	}
	
	
}

module.exports = {
	'render' : render
};