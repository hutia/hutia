/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter;
var mixin = require('utils-merge');
var express = require('express');
var proto = require('./application');


/**
 * Expose `createApplication()`.
 */

exports = module.exports = createApplication;

/**
 * Create an hutia application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
	var app = express();

	mixin(app, proto);

	app.init();
	
	return app;
}
