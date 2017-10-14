var fs = require('fs');
const fork = require('child_process');
var chokidar = require('chokidar');
var watcher = chokidar.watch('./Commitments', {ignoreInitial: true});

var config = require('../config/settings');
var zmq = require('zeromq'),
	sock = zmq.socket('pub');

var host = config.sensor.address.host;
var port = config.sensor.address.port;

sock.bindSync('tcp://' + host + ':' + port);

//var TempPublisher = require('./TempPublisher');
var TiltPublisher = require('./TiltPublisher');
var TempHumPublisher = require('./TempHumPublisher');

//var tempSensor = new TempPublisher(sock);
var tiltSensor = new TiltPublisher(sock);
var tempHumSensor = new TempHumPublisher(sock);

class Handler {
	initializeHandler() {
	
		watcher.on('add', function(path)
		{

			var file = JSON.parse(fs.readFileSync('./' + path, 'utf8'));
			console.log('\nNew File : ' + path);
			var child = fork.fork('./chandler.js');
			
			//DA SPOSTARE DOPO IL CONTROLLO
			//tempSensor.sense();
			//tiltSensor.sense();
			//tempHumSensor.sense();
			
			child.send(file);
			console.log('ID process' + child.pid);
			
		})

		require('chokidar').watch('./Commitments', {ignoreInitial: true}).on('add',
 			function(event, path) {});
	}
}
exports.Handler = Handler;
