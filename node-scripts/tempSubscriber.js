var config = require('../config/settings');

var zmq = require('zeromq')
    , sock = zmq.socket('sub');

var address = config.sensor.address.host;
var port = config.sensor.address.port;
var topic = config.sensor.topic.temperature;
var a = 0;
var arr = [];


sock.connect('tcp://' + address + ':' + port);
sock.subscribe(topic);
sock.subscribe(config.sensor.topic.simpleinclination);
console.log('subscriber connected to port:' + port);

sock.on('message', function (topic, message) {
    if (topic == config.sensor.topic.temperature){
			
			arr.push(message.toString('utf8'));
			if(arr.length === 2){
				for (var i=0; i < arr.length ; i++){
					console.log(arr[i]);
				}
			}
			console.log(arr.length);
	}
	else
    console.log(message.toString('utf8'));
});


