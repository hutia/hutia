
module.exports.onconnection = function(socket){
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});
	
	socket.on('disconnect', function(){
		console.log('socket client disconnected');
		console.log('socket id ' + socket.id);
	});
};