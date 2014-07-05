/**
 * Module dependencies.
 */
var sqlite3 = require('sqlite3').verbose();

/**
 * Expose `createApplication()`.
 */

exports = module.exports = Database;

function Database(dbpath){
	var db = new sqlite3.Database(dbpath);
	
	db.initTable = function(name, cols, callback){
		var sql = [];
		for (var c in cols) sql.push(c + ' ' + cols[c]);
		this.exec('DROP TABLE IF EXISTS `' + name + '`;');
		return this.exec('CREATE TABLE `' + name + '`(' + sql.join(',') + ');', callback);
	};
	
	db.insert = function(table, data, callback){
		var names = [], values = [];
		for (var name in data) {
			names.push('`'+name+'`');
			values.push(util.format('%j', data[name]));
		}
		this.exec('INSERT INTO `' + table + '` (' + names.join(',') + ') VALUES (' + values.join(',') + ');', callback);
	};
	
	return db;
}