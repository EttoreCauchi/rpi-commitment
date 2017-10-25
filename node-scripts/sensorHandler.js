var config = require('../config/settings');
var zmq = require('zeromq'),
	sock = zmq.socket('pub');

var host = config.sensor.address.host;
var port = config.sensor.address.port;

sock.bindSync('tcp://' + host + ':' + port);
console.log('publishers socket bound to port ' + port);

//var TempPublisher = require('./TempPublisher');
var TiltPublisher = require('./TiltPublisher');
var TempHumPublisher = require('./TempHumPublisher');

//var tempSensor = new TempPublisher(sock);
var tiltSensor = new TiltPublisher(sock);
var tempHumSensor = new TempHumPublisher(sock);


//tempSensor.sense();
tiltSensor.sense();
tempHumSensor.sense();


