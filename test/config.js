module.exports = {
	"favicon" : "",
	"logger" : "dev",
	"root" : "../www",
	"database" : "../db/data.db",
	"session" : { secret: 'hutia-secret', cookie: { maxAge: 60 * 60 * 1000 }},
	"port" : 80,
	"charset" : "utf8",
	"socket" : false
};