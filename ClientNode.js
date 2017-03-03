/*page.onConsoleMessage = function(msg) {
  console.log('Page title is ' + msg);
};*/

var url = "http://stage.wakeupu.net:8001"
var i = 0;
var connections = 20;
var sum = 0;
var interval = setInterval(function() {
 i++; 
 //var socket = require('socket.io-client')('http://stage.wakeupu.net:8001',{
 var socket = require('socket.io-client')('http://localhost:8001',{
  forceNew: true
 });
 socket.on('connect', function(){
	if(i%3==0)
		socket.emit('addtoroom',{'roomId':1});
	else if(i%3==1)
		socket.emit('addtoroom',{'roomId':2});
	else if(i%3==2)
		socket.emit('addtoroom',{'roomId':3});
	
 });
 
 socket.on('message', function(data){ 
 console.log(data);
  if(data.message == 'c'){
   sum = 0;
  } else {
  sum ++; }
 });
 socket.on('disconnect', function(){});
 
 if(i >= connections) {
  clearInterval(interval);
 }
}, 10);

var a = setInterval(function() {
 console.log(sum);
}, 1000)