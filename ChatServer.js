 fs = require('fs');  
 url = require('url');
 express = require('express');
 app = express();
 
server = require('http').createServer(app);
socketio = require('socket.io')(server);

//console.log(__dirname + '\\css\\style.css');
//app.use(express.directory(__dirname));

//The root and all subs are made static
app.use(express.static(__dirname));

/*app.get('/sarim',function(request,response){
	response.sendFile(__dirname + "/html/index.html");
});
*/

//entry point
//since the startpoint has become html/index.html serving virtually at root(WatchTogether) so all the references in this file will be according to root(relative) not absolute
/*app.all('/',function(request,response){
	response.sendFile(__dirname + "/html/index.html");
});
*/

app.get('/',function(request,response){
	response.sendFile(__dirname + "/html/index.html");
});

app.get('/html/create room.html',function(request,response){
	response.sendFile(__dirname + "/html/create room.html");
});

app.get('/([a-z]|[A-Z]|[0-9]){9}',function(request,response){
	console.log(request.url);
	response.sendFile(__dirname + "/html/user_room_page.html");
});

server.listen(3000);

rooms = {};

var connectedUsers = 0;

socketio.on('connection',function(socket){
	connectedUsers++;
	console.log('Connected Users: ' + connectedUsers);	
	//console.log('onconnection is called');
	//console.log(socket.handshake.headers.referer);

	socket.on('createRoom',function(data){
		//var roomId = makeId();
		//socket.join(roomId);
		//console.log('joined a room');
		socketio.to(socket.id).emit('roomRegisterResponse',{'roomId':''});

		for(var i in socketio.sockets.adapter.rooms)
		{
			console.log(i);
		}
	});

	//Notification,username and roomId from user
	socket.on('joinTheRoom',function(data){
		var urlRoomId = data.roomId;
		var username = data.username;
		var exists = false;

		for(var i in socketio.sockets.adapter.rooms){
			if(urlRoomId == i){
				socket.join(urlRoomId);
				//rooms[urlRoomId] = {};
				rooms[urlRoomId][username] = socket.id;
				//console.log(rooms);
				exists = true;
				socketio.to(socket.id).emit("OnClientRegisteredToRoom",{"message":"You have been registered","roomId": urlRoomId});
				console.log(rooms[urlRoomId]);
				socketio.to(urlRoomId).emit('newRoomUserJoined',{'roomUsers': rooms[urlRoomId]});
				console.log("Joined room: " + urlRoomId);
				break;
			}
		}

		if(!exists) console.log("Room doesn't exist");
		
	});

	//Notification from IndexPage that I have got the roomRegisteredResponse
	socket.on('roomRegisteredFromIndexPage',function(data){
		//For create room page
		socket.emit('roomRegisteredForCreateRoomNotify',{"roomId":data.roomId});
	});


	//When some users disconnects
	socket.on('disconnect',function(){
		connectedUsers--;

		for(x in rooms){
			for(y in rooms[x]){
				//console.log(socket.id + " disconnected");
				if(rooms[x][y] == socket.id){
					delete rooms[x][y];
					//Tag: There is a problem in this code re check sarim
					if(isRoomEmpty(rooms[x])){
						delete rooms[x];
					}
					else{
					//console.log("After unjoining:" + x);
					socketio.to(x).emit('newRoomUserJoined',{'roomUsers': rooms[x]});
					break;
					}

				}
			}
		}

		console.log('Connected Users: ' + connectedUsers);	
	});

	//temporarily adding
	socket.on('createRoomFromCreateRoomPage',function(){
		var roomId = makeId();
		socket.join(roomId);

		//Adding Admin info to local database
		rooms[roomId] = {};
		rooms[roomId]["Admin"] = socket.id;

		console.log('joined a room');
		socketio.to(socket.id).emit('YesWeRegisteredYourRoom',{'roomId':roomId});
	});

	//Receive Msg: When server gets chat message from client or creator
	socket.on('OnPublicMessageSend',function(data){
		console.log("Server received " + data.message + " from " + data.username );
		socketio.to(data.roomId).emit('OnPublicMessageServerResponse',{'username': data.username, 'message': data.message});
	});

	//Youtube Set Video: Creator control to set video for clients to be loaded.
	socket.on('onVideoUrlSetFromCreator',function(data){
		socketio.to(data.roomId).emit('onVideoUrlSetFromServer',{'videoId': data.videoId});
	});

	//Vimeo Set Video : Creator control to set video for clients to be loaded.
	socket.on('onVimeoVideoUrlSetFromCreator',function(data){
		socketio.to(data.roomId).emit('onVimeoVideoUrlSetFromServer',{'videoId': data.videoId});
	});

	//Youtube Play video: Creator control to play video for clients
	socket.on('onCreatorPlayingStatus',function(data){
		socketio.to(data.roomId).emit('onPlayVideoFromServer',{'duration':data.duration , 'isPaused':data.isPaused});//changed this at 2:15 am
	});

	//Vimeo Play video: Creator control to play video for clients
	socket.on('onVimeoCreatorPlayingStatus',function(data){
		console.log("onVimeoCreatorPlayingStatus");
		socketio.to(data.roomId).emit('onVimeoPlayVideoFromServer',{'duration':data.duration , 'isPaused':data.isPaused});//changed this at 2:15 am
	});

	//Youtube Pause Video: Creator control to pause video for clients
	socket.on('onCreatorPausedStatus',function(data){
		console.log("Got pause call from creator room");
		socketio.to(data.roomId).emit('onPauseVideoFromServer',{'duration':data.duration , 'isPaused':data.isPaused}); //changed this at 2:15 am
	});

	//Vimeo Pause Video: Creator control to pause video for clients
	socket.on('onVimeoCreatorPausedStatus',function(data){
		console.log("Got pause call from creator room");
		socketio.to(data.roomId).emit('onVimeoPauseVideoFromServer'); //changed this at 2:15 am
	});

	//Youtube Client Join during video: Call from client
	socket.on('onJoinDuringFromClient',function(data){
		socketio.to(data.roomId).emit('onJoinDuringQueryFromServer');
	});

	//Vimeo Client Join during video: Call from client
	socket.on('onVimeoJoinDuringFromClient',function(data){
		console.log("Request from client video is vimeo or not");
		socketio.to(data.roomId).emit('onVimeoJoinDuringQueryFromServer');
	});

	//Youtube Creator response at which duration he is to tell the newly joined client
	socket.on('onDurationReplyFromCreator',function(data){
		console.log("Duration: " + data.duration);
		console.log("VideoID: " + data.videoId);
		socketio.to(data.roomId).emit('onDurationResponseFromServer',{'videoId':data.videoId,'duration':data.duration,'isPaused':data.isPaused});//changed this at 2:15 am it is ok
	});

	//Vimeo Creator response at which duration he is to tell the newly joined client
	socket.on('onVimeoDurationReplyFromCreator',function(data){
		console.log("Duration: " + data.duration);
		console.log("VideoID: " + data.videoId);  //yeh yad rakh yah onVimeoDurationReplyFromServer tha
		socketio.to(data.roomId).emit('onVimeoVideoUrlSetFromServer',{'videoId':data.videoId,'duration':data.duration,'isPaused':data.isPaused});//changed this at 2:15 am it is ok
	});

	//Pause Event: From client
	socket.on('onPlayFromClient',function(){
		console.log("client played the video");
	});

	//Testing
	socket.on('durationBarMoved',function(){
		console.log("Duration bar moved on the player");
	});
/*
	if(socket.handshake.headers.referer.indexOf("/index.html/") > -1 ){
		var clientUrl=socket.handshake.headers.referer;
		//console.log(clientUrl);
		var urlRoomId = clientUrl.substring(clientUrl.indexOf('/index.html/')+ '/index.html/'.length, clientUrl.length);
		//console.log(urlRoomId);

		for(var i in socketio.sockets.adapter.rooms){
			if(urlRoomId == i){
				socket.join(urlRoomId);

				//Sarim you were here
				socketio.to(socket.id).emit("OnClientRegisteredToRoom",{"message":"You have been registered","roomId": urlRoomId});
				console.log("Joined room: " + urlRoomId);
				break;
			}
		}
	}
	else
	{
		//console.log("invalid url or room id");
	}
*/	

/*
	socket.on('registerRoom',function(data){
		console.log(data.roomName + ' joined');
		var generatedString = makeId();
		var roomId = data.roomName + "/" + makeId(); 
		socket.join(roomId);

		//this data is sent back to the creator of the room so that he can share the link to call
		socketio.in(roomId).emit("roomCreatedResponse",{'roomId':roomId});
		
		//console.log(socketio.sockets.adapter.rooms);
	});
	
	socket.on('disconnect',function(){
		connectedUsers--;
		console.log('Connected Users:' + connectedUsers);
	});
*/	
	//console.log(socketio.sockets.adapter.rooms);
	console.log('Connected Users: ' + connectedUsers);	
});

function isRoomEmpty(roomId){
	var count =0;
	for(var member in rooms[roomId]){
		count++;
	}

	if(count < 0)
		return true;
	else
		return false;
}
//This method generates a random string
function makeId()
{
    var text = "";
    var possible = "CDFnGHIJK9LMOP3QTpUXYZacdEefgBbhijklmoqAsVNtuSwxyz0R124r56W7v8";
    for( var i=0; i < 9; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function handler(req, res){
	//res.writeHead(200, { 'Content-type': 'text/html'});

	//console.log(socketio.sockets.adapter)
	/*for(var room in socketio.sockets.adapter.rooms){
		JSON.stringify(room,function(key,val){
			console.log('key: ' + key);
			console.log('value: ' + val);
		});
	}*/

	var urlObject = url.parse(req.url,true);
	//handler.handle(urlObject.pathname,req,res);
	if(urlObject.pathname.indexOf('/index.html')>-1 ){
		//res.writeHead(200, { 'Content-type': 'text/css'});
		//fs.readFileSync(__dirname + "/css/style.css")
		res.writeHead(200);
		res.end(fs.readFile(__dirname + '/html/index.html'));
		//res.end(fs.createReadStream(__dirname + '/index.html')).pipe(res);
		//res.end();
	}
	
	if(urlObject.pathname.indexOf('/index.html/') > -1){
		res.end(fs.readFileSync(__dirname + '/ConnectingPage.html'));
	}


		/*if(urlObject.query.roomId != undefined){
			
			//socketio.in('Room' + urlObject.query.roomId).emit('message','Hello Room' + urlObject.query.roomId);
		}
		else{
			return;
		}*/
	else {
		res.end();
	}	
}