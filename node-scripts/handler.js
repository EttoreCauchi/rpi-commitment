var fs = require('fs');
const fork = require('child_process');
var chokidar = require('chokidar');
var watcher = chokidar.watch('./Commitments', {ignoreInitial: true});

var config = require('../config/settings');
//var zmq = require('zeromq');
//var sock = zmq.socket('pub');

var host = config.sensor.address.host;
var port = config.sensor.address.port;

//sock.bindSync('tcp://' + host + ':' + port);

//var TempPublisher = require('./TempPublisher');
var TiltPublisher = require('./TiltPublisher');
var TempHumPublisher = require('./TempHumPublisher');

//var tempSensor = new TempPublisher(sock);
//var tiltSensor = new TiltPublisher(sock);
//var tempHumSensor = new TempHumPublisher(sock);

var temp_line = [];
var tilt_line = [];
var temp_hum_line = [];

class Handler {
	initializeHandler() {
	
		watcher.on('add', function(path)
		{

			var file = JSON.parse(fs.readFileSync('./' + path, 'utf8'));
			console.log('\nNew File : ' + path);
			var child = fork.fork('./chandler.js');
			if (temp_line.length == 0)
			{
				if (file.commitment.antecedentCondition.operation == '&&' || file.commitment.antecedentCondition.operation == '||' ||
					file.commitment.consequentCondition.operation == '&&' || file.commitment.consequentCondition.operation == '&&')
				{
					if (file.commitment.antecedentCondition.variables[0].variables[0] == 'temp' ||
						file.commitment.antecedentCondition.variables[1].variables[0] == 'temp' ||
							file.commitment.consequentCondition.variables[0].variables[0] == 'temp' ||
								file.commitment.consequentCondition.variables[1].variables[0] == 'temp')
					{
						//tempSensor.sense();
						temp_line.push(child.pid);
						console.log("Connected to Temp Sensor\n");
					}
				}
				else if (file.commitment.antecedentCondition.operation == '==' || file.commitment.antecedentCondition.operation == '!=' ||
						file.commitment.consequentCondition.operation == '==' || file.commitment.consequentCondition.operation == '!=' ||
							file.commitment.antecedentCondition.operation == '<' || file.commitment.antecedentCondition.operation == '>' ||
								file.commitment.consequentCondition.operation == '<' || file.commitment.consequentCondition.operation == '>')
				{
					if (file.commitment.antecedentCondition.variables[0] == 'temp' ||
						file.commitment.consequentCondition.variables[0] == 'temp')
					{
						//tempSensor.sense();
						temp_line.push(child.pid);
						console.log("Connected to Temp Sensor\n");
					}
				}
			}
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
