/**
 * Module dependencies.
 */
var path = require('path');
var http = require('http');
var connect = require('connect');

var engines = require('./engines');
var DB = require('./database');

/**
 * Application prototype.
 */

var app = exports = module.exports = {};

// initiate the application from express()
app.init = function(){
	// private
	var that = this;
	var _root = process.cwd();
	var _port = 80;
	var _status = 'stopped'; // can be ['stopped', 'starting', 'started', 'stopping']
	var _server = http.createServer(this);
	
	// public properties
	Object.defineProperties(this, {
		// root path for web site
		root : {
			set : function (x){
				_root = path.resolve(process.cwd(), x);
			},
			get : function(){
				return _root;
			}
		},
		// port for web site
		port : {
			set : function (x){
				x = parseInt(x);
				if (isNaN(x) || x<0 || x>0xffff) throw new Error('Illegal port number');
				_port = x;
			},
			get : function(){
				return _port;
			}
		},
		// status of server
		status : {
			get : function(){
				return _status;
			}
		}
	});
	
	this.resolve = function(v1, v2){
		if (arguments.length > 1) {
			if (/^\s*[\\\/]/.test(v2)) {
				return path.resolve(_root, String(v2).replace(/^\s*[\\\/]/,''));
			} else {
				return path.resolve(v1, v2);
			}
		} else {
			return path.resolve(_root, String(v1).replace(/^\s*[\\\/]/,''));
		}
	};
	
	// start server
	this.start = function(callback){
		// logging status
		_status = 'starting';
		
		// check settings and middle-wares
		this.get('favicon') && this.use(connect.favicon(this.get('favicon')));
		
		this.get('logger') && this.use(connect.logger(this.get('logger')));
		
		if (this.get('session')){
			this.use(connect.cookieParser());
			this.use(connect.cookieSession(this.get('session')));
		}
		
		this.use(connect.json());
		this.use(connect.urlencoded());
		
		for (var ext in engines) this.engine(ext, engines[ext]);
		
		this.use(connect.static(_root));
		
		// initialize database
		if (this.get('dbpath')) this.db = new DB(path.resolve(process.cwd(), this.get('dbpath')));
		
		// start listening
		_server.listen(_port, function(){
			_status = 'started';
			if ('function' === typeof callback) callback();
		});
	};

	this.stop = function(callback){
		_status = 'stopping';
		_server.close(function(){
			_status = 'stopped';
			if ('function' === typeof callback) callback();
		});
		if (this.db) {
			this.db.close();
			delete this.db();
		}
	};
	
	// @override
	this.engine = function(ext, callback){
		var reg = new RegExp('\\.' + String(ext) + '$', 'i');
		that.all('*', function(req, res, next){
			if (reg.test(req.path)) callback(req, res, next, that);
			else next();
		});
	};
};

