var fs = require('fs');
const fork = require('child_process');
var chokidar = require('chokidar');
var watcher = chokidar.watch('./Commitments', {ignoreInitial: false});

var TiltPublisher = require('./TiltPublisher');
var TempHumPublisher = require('./TempHumPublisher');

var tilt_line = [];
var temp_hum_line = [];
var ldr_line = []

class Handler {
	initializeHandler(sock) {
		
		var tiltSensor = new TiltPublisher(sock);
		var tempHumSensor = new TempHumPublisher(sock);
		
		watcher.on('add', function(path)
		{

			var file = JSON.parse(fs.readFileSync('./' + path, 'utf8'));
			console.log('\nNew File : ' + path + '\n');
			var child = fork.fork('./chandler.js');
			
			//Check if temp, hum and tilt are in the commitment and starts the sensors

			if (file.commitment.antecedentCondition.operation == '&&' || file.commitment.antecedentCondition.operation == '||' ||
				file.commitment.consequentCondition.operation == '&&' || file.commitment.consequentCondition.operation == '||')
			{
				if (file.commitment.antecedentCondition.variables[0].variables[0] == 'temp' ||
					file.commitment.antecedentCondition.variables[0].variables[0] == 'hum' ||
						file.commitment.antecedentCondition.variables[1].variables[0] == 'temp' ||
						file.commitment.antecedentCondition.variables[1].variables[0] == 'hum' ||
							file.commitment.consequentCondition.variables[0].variables[0] == 'temp' ||
							file.commitment.consequentCondition.variables[0].variables[0] == 'hum' ||
								file.commitment.consequentCondition.variables[1].variables[0] == 'temp' ||
								file.commitment.consequentCondition.variables[1].variables[0] == 'hum')
				{
					if(temp_hum_line.length == 0)
					{
						tempHumSensor.sense();
						temp_hum_line.push(child.pid);
						console.log("Connected to TempHum Sensor\n");
					}
					else
						temp_hum_line.push(child.pid);
				}
				if (file.commitment.antecedentCondition.variables[0].variables[0] == 'tilt' ||
					file.commitment.antecedentCondition.variables[1].variables[0] == 'tilt' ||
						file.commitment.consequentCondition.variables[0].variables[0] == 'tilt' ||
							file.commitment.consequentCondition.variables[1].variables[0] == 'tilt')
				{
					if(tilt_line.length == 0)
					{
						tiltSensor.sense();
						tilt_line.push(child.pid);
						console.log("Connected to Tilt Sensor\n");
					}
					else
						tilt_line.push(child.pid);
				}
			}
			else if (file.commitment.antecedentCondition.operation == '==' || file.commitment.antecedentCondition.operation == '!=' ||
					file.commitment.consequentCondition.operation == '==' || file.commitment.consequentCondition.operation == '!=' ||
						file.commitment.antecedentCondition.operation == '<' || file.commitment.antecedentCondition.operation == '>' ||
							file.commitment.consequentCondition.operation == '<' || file.commitment.consequentCondition.operation == '>')
			{
				if (file.commitment.antecedentCondition.variables[0] == 'temp' ||
					file.commitment.antecedentCondition.variables[0] == 'hum' ||
						file.commitment.consequentCondition.variables[0] == 'temp' ||
						file.commitment.consequentCondition.variables[0] == 'hum')
				{
					if(temp_hum_line.length == 0)
					{
						tempHumSensor.sense();
						temp_hum_line.push(child.pid);
						console.log("Connected to TempHum Sensor\n");
					}
					else
						temp_hum_line.push(child.pid);
				}
				if (file.commitment.antecedentCondition.variables[0] == 'tilt' ||
					file.commitment.consequentCondition.variables[0] == 'tilt')
				{
					if(tilt_line.length == 0)
					{
						tiltSensor.sense();
						tilt_line.push(child.pid);
						console.log("Connected to Tilt Sensor\n");
					}
					else
						tilt_line.push(child.pid);
				}
			}

			
			child.send(file);
			console.log('ID process ' + child.pid);
			for(var i = 0; i<temp_hum_line.length; i++)
				console.log(temp_hum_line[i] + ' ');
			
		})

		require('chokidar').watch('./Commitments', {ignoreInitial: false}).on('add',
 			function(event, path) {});
	}
}
exports.Handler = Handler;
