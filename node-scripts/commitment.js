var JSONMath = require('json-logic');
var fs = require('fs');
var Stately = require('stately.js');
var sleep = require('sleep');
var request = require('request');
const fork = require('child_process');
var config = require('../config/settings');
var zmq = require('zeromq');
var sock = zmq.socket('sub');

var address = config.sensor.address.host;
var port = config.sensor.address.port;

sock.connect('tcp://' + address + ':' + port);
		
var temp = null;
var hum = null;
var tilt = 'False';
var ldr = null;
var commitWin = true; //it becomes false if the activity ends

class Commit
{

	initializeCommit(file)
	{
		//Subscribtion only to the sensors in the commitment
		if (file.commitment.antecedentCondition.operation == '&&' || file.commitment.antecedentCondition.operation == '||' ||
			file.commitment.consequentCondition.operation == '&&' || file.commitment.consequentCondition.operation == '||')
		{
			var find_TH = false;
			for (var i = 0; i < file.commitment.antecedentCondition.variables.length && find_TH == false; i++)
			{
				if (file.commitment.antecedentCondition.variables[i].variables[0] == 'temp' ||
					file.commitment.antecedentCondition.variables[i].variables[0] == 'hum')
					find_TH = true;
			}
			for (var i = 0; i < file.commitment.consequentCondition.variables.length  && find_TH == false; i++)
			{
				if (file.commitment.consequentCondition.variables[i].variables[0] == 'temp' ||
					file.commitment.consequentCondition.variables[i].variables[0] == 'hum')
					find_TH = true;
			}
			if (find_TH == true)
			{
				sock.subscribe('temp');
				sock.subscribe('hum');
			}
			else 
			{
				sock.subscribe('Ping');
			}
			var find_TT = false;
			for (var i = 0; i < file.commitment.antecedentCondition.variables.length && find_TT == false; i++)
			{
				if (file.commitment.antecedentCondition.variables[i].variables[0] == 'tilt')
					find_TT = true;
			}
			for (var i = 0; i < file.commitment.consequentCondition.variables.length  && find_TT == false; i++)
			{
				if (file.commitment.consequentCondition.variables[i].variables[0] == 'tilt')
					find_TT = true;
			}
			if (find_TT == true)
			{
				sock.subscribe('tilt');
				var head = {
				'Sensor' : 'tilt'
				}
				saveInTheDatabase(head, 'sensors', 'POST', {'value' : tilt});
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
				sock.subscribe('temp');
				sock.subscribe('hum');				
			}
			else 
			{
				sock.subscribe('Ping');
			}
			if (file.commitment.antecedentCondition.variables[0] == 'tilt' ||
				file.commitment.consequentCondition.variables[0] == 'tilt')
			{
				sock.subscribe('tilt');
				var head = {
				'Sensor' : 'tilt'
				}
				saveInTheDatabase(head, 'sensors', 'POST', {'value' : tilt});
			}
		}
		
		sock.subscribe(file.commitment.id);
		
		//Initialize states machine
		var monitoring = fsm_status();

		var creationDate;
		var tCreation;
		var detachDate;
		var tDetaching;
		var tReference;
		var ant_logic = new JSONMath;
		var con_logic = new JSONMath;
		var thereIsAntecedent = false;
		var ant_res;
		var con_res;
		var maxA;
		var minA;
		var maxC;
		var minC;

		var type = file.commitment.type;

		console.log('\nID ' + file.commitment.id + 
				': ' + monitoring.getMachineState());
				
		//Save the status on the database
		var headers = {
			'Id': file.commitment.id,
			'Strength': file.commitment.strenght,
			'Type': file.commitment.type
		}			
		saveInTheDatabase(headers, 'commitments', 'POST', {'status': monitoring.getMachineState()});
		
		//To be done when a message is received
		sock.on('message', function (topic, message)
		{
			if(topic.toString('utf8') === file.commitment.id && message.toString('utf8') === 'start' && monitoring.getMachineState() == 'NULL')
			{
				if(file.commitment.antecedentCondition.variables != true)
				{
					thereIsAntecedent = true;
					ant_res = ant_logic.execute({
						"antecedent": file.commitment.antecedentCondition
					});
					maxA = absolute_time(0, file.commitment.antecedentCondition.maxA, 0);
					minA = absolute_time(0, file.commitment.antecedentCondition.minA, 0);
					monitoring.tick_c();
					creationDate = new Date();
					//Connected to Rest (Commitment start)
					tCreation = absolute_time(creationDate.getHours(), creationDate.getMinutes(), creationDate.getSeconds());
				}
				else
				{
					console.log('NO ANTECEDENT');
					monitoring.tick_c();
					monitoring.tick_d();
					creationDate = new Date();
					//Connected to Rest (Commitment start)
					tCreation = absolute_time(creationDate.getHours(), creationDate.getMinutes(), creationDate.getSeconds());
					detachDate = new Date();
					tDetaching = absolute_time(detachDate.getHours(), detachDate.getMinutes(), detachDate.getSeconds());
					if(file.commitment.consequentCondition.refC == 'creation')
						tReference = tCreation;
					else
						tReference = tDetaching;
				}
				if(file.commitment.consequentCondition.variables != true)
				{
					con_res = con_logic.execute({
						"consequent": file.commitment.consequentCondition
					});
				}
				else
				{
					con_res = con_logic.execute({
						"consequent": true
					});
				}
				maxC = absolute_time(0, file.commitment.consequentCondition.maxC, 0);
				minC = absolute_time(0, file.commitment.consequentCondition.minC, 0);

				console.log('\nID ' + file.commitment.id + 
						': ' + monitoring.getMachineState());
						
				//Save the new status on the database
				saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});
			}
			else if(topic.toString('utf8') === file.commitment.id && message.toString('utf8') === 'end')
			{
				commitWin = false;
			}
			else if(topic.toString('utf8') === file.commitment.id && message.toString('utf8') === 'cancel')
			{
				if(monitoring.getMachineState() == 'CONDITIONAL')
				{
					monitoring.cancel();
					console.log('ID ' + file.commitment.id + 
						': ' + monitoring.getMachineState());
							
					//Save the new status on the database
					saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});		
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else if(monitoring.getMachineState() == 'DETACHED')
				{
					monitoring.cancel();
					console.log('ID ' + file.commitment.id + 
						': ' + monitoring.getMachineState());
							
					//Save the new status on the database
					saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});	
					sock.disconnect('tcp://' + address + ':' + port);
				}
			}
			else if(topic.toString('utf8') === file.commitment.id && message.toString('utf8') === 'release' &&
					(monitoring.getMachineState() == 'CONDITIONAL' || monitoring.getMachineState() == 'DETACHED'))
			{
				monitoring.release();
				console.log('ID ' + file.commitment.id + 
					': ' + monitoring.getMachineState());
							
				//Save the new status on the database
				saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});		
				sock.disconnect('tcp://' + address + ':' + port);
			}
			else if(topic.toString('utf8') === file.commitment.id && message.toString('utf8') === 'suspend' && monitoring.getMachineState() == 'DETACHED')
			{
				monitoring.suspend();
				console.log('ID ' + file.commitment.id + 
					': ' + monitoring.getMachineState());
							
				//Save the new status on the database
				saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});
			}
			else if(topic.toString('utf8') === file.commitment.id && message.toString('utf8') === 'reactivate' && monitoring.getMachineState() == 'PENDING')
			{
				//Reactivate signal 
				monitoring.reactivated();
				console.log('ID ' + file.commitment.id + 
							': ' + monitoring.getMachineState());
							
				//Save the new status on the database
				saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});
			}


			var head = {
				'Sensor' : topic.toString('utf8')
			}
			
			//Update the values coming from the sensors
			if(topic.toString('utf8') === config.sensor.topic.temperature && message.toString('utf8') != temp)
			{
				temp = message.toString('utf8');
				console.log('Temp : ' + temp);
				saveInTheDatabase(head, 'sensors', 'POST', {'value' : temp});
			}
			else if (topic.toString('utf8') === config.sensor.topic.humidity && message.toString('utf8') != hum)
			{
				hum = message.toString('utf8');
				console.log('Hum : ' + hum);
				saveInTheDatabase(head, 'sensors', 'POST', {'value' : hum});
			}
			else if (topic.toString('utf8') === config.sensor.topic.simpleinclination  && message.toString('utf8') != tilt)
			{
				tilt = message.toString('utf8');
				console.log('Tilt : ' + tilt);
				saveInTheDatabase(head, 'sensors', 'POST', {'value' : tilt});
			}
			else if (topic.toString('utf8') === config.sensor.topic.brightness && message.toString('utf8') != ldr)
			{
				ldr = message.toString('utf8');
				console.log('Ldr : ' + ldr);
				saveInTheDatabase(head, 'sensors', 'POST', {'value' : ldr});
			}
			
			//Conditions evaluation
			if(monitoring.getMachineState() == 'CONDITIONAL')
			{
				if(after_A_Win(tCreation, maxA))
				{
					monitoring.tick_e();
					console.log('\nID ' + file.commitment.id + 
						': ' + monitoring.getMachineState());
					
					//Save the new status on the database
					saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});
					
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else if(commitWin == false)
				{
					monitoring.tick_t();
					console.log('\nID ' + file.commitment.id + 
						': ' + monitoring.getMachineState());
						
					//Save the new status on the database
					saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});
						
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else
				{	
					ant_res.antecedent = commitmentEvaluation(file.commitment.antecedentCondition);
					if(before_A_Win(tCreation, minA) || (in_A_Win(tCreation, minA, maxA) && ant_res.antecedent == false))
					{
						monitoring.tick_c();
						console.log('ID ' + file.commitment.id + 
							': ' + monitoring.getMachineState());
						//No sense to update the status on the database
					}
					else if(in_A_Win(tCreation, minA, maxA) && ant_res.antecedent == true)
					{
						monitoring.tick_d();
						console.log('ID ' + file.commitment.id + 
							': ' + monitoring.getMachineState());
							
						//Save the new status on the database
						saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});	
							
						detachDate = new Date();
						tDetaching = absolute_time(detachDate.getHours(), detachDate.getMinutes(), detachDate.getSeconds());
						if(file.commitment.consequentCondition.refC == 'creation')
							tReference = tCreation;
						else
							tReference = tDetaching;
					}
				}
			}
			if(monitoring.getMachineState() == 'DETACHED')
			{
				if(commitWin == false)
				{
					monitoring.tick_v();
					console.log('\nID ' + file.commitment.id + 
						': ' + monitoring.getMachineState());
						
					//Save the new status on the database
					saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});
						
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else if(type == 'persistent' && after_C_Win(tReference, maxC))
				{
					monitoring.tick_s();
					console.log('ID ' + file.commitment.id + 
						': ' + monitoring.getMachineState());
						
					//Save the new status on the database
					saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});	
						
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else
				{
					con_res.consequent = commitmentEvaluation(file.commitment.consequentCondition);
					if((type == 'persistent' && in_C_Win(tReference, minC, maxC) && con_res.consequent == false) ||
						(type == 'goal' && after_C_Win(tReference, maxC)))
					{
						monitoring.tick_v();
						console.log('ID ' + file.commitment.id + 
							': ' + monitoring.getMachineState());
							
						//Save the new status on the database
						saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});	

						sock.disconnect('tcp://' + address + ':' + port);
					}
					else if(type == 'goal' && con_res.consequent == true && in_C_Win(tReference, minC, maxC)) 
					{
						monitoring.tick_s();
						console.log('ID ' + file.commitment.id + 
							': ' + monitoring.getMachineState());
							
						//Save the new status on the database
						saveInTheDatabase(headers, 'commitments', 'PUT', {'status': monitoring.getMachineState()});	
							
						sock.disconnect('tcp://' + address + ':' + port);
					}
					else if(before_C_Win(tReference, minC) || (in_C_Win(tReference, minC, maxC) && ((type == 'goal' && con_res.consequent == false) || 
						(type == 'persistent' && con_res.consequent == true))))
					{
						monitoring.tick_d();
						console.log('ID ' + file.commitment.id + 
							': ' + monitoring.getMachineState());
						//No sense to update the status on the database
					}
				}
			}
		}); //end sock
	}
}
exports.Commit = Commit;


function fsm_status() 
{
	var monitoring = Stately.machine(
	{
	    'NULL': {
		'tick_c':  /* => */ 'CONDITIONAL'
	    },
	    'CONDITIONAL': {
		'tick_e':   /* => */ 'EXPIRED',
		'tick_c':   /* => */ 'CONDITIONAL',
	 	'tick_d':   /* => */ 'DETACHED',
		'tick_t':   /* => */ 'TERMINATED',
		'cancel':   /* => */ 'TERMINATED',
		'release':   /* => */ 'TERMINATED'
	    },
	    'DETACHED': {
		'tick_d': /* => */ 'DETACHED',
		'tick_s':  /* => */ 'SATISFIED',
		'tick_v':   /* => */ 'VIOLATED',
	 	'cancel':   /* => */ 'VIOLATED',
		'suspend':   /* => */ 'PENDING',
		'release':   /* => */ 'TERMINATED'
	    },
	    'PENDING': {
		'reactivated': /* => */ 'DETACHED'
	    },
		'EXPIRED': {
		},
		'TERMINATED': {
		},
		'SATISFIED': {
		},
		'VIOLATED': {
		}
	});
	return(monitoring);
}



function commitmentEvaluation (file_condition)
{
	if (file_condition.operation == '&&')
	{
		var op = [];
		var index = [];
		var cond = [];
		var result = []
		
		for (var i = 0; i < file_condition.variables.length; i++)
		{
			op.push(file_condition.variables[i].operation);
			index.push(file_condition.variables[i].variables[0]);
			cond.push(file_condition.variables[i].variables[1]);
			result.push(con_evaluation(op[i], index[i], cond[i]));
		}
		
		for (var i = 0; i < file_condition.variables.length-1; i++)
			console.log('(' + index[i] + ' ' + op[i] + ' ' + cond[i] + ' --> ' + result[i] + ') && ');
			
		console.log('(' + index[file_condition.variables.length-1] + ' ' + op[file_condition.variables.length-1] + ' ' + 
			cond[file_condition.variables.length-1] + ' --> ' + result[file_condition.variables.length-1] + ')\n');	
			
		for (var i = 0; i < file_condition.variables.length; i++)
		{
			if(result[i] == 0)
				return (false);
		}
		return (true);
	
	/*
		var op_1 = file_condition.variables[0].operation;
		var op_2 = file_condition.variables[1].operation;
		var index_1 = file_condition.variables[0].variables[0];
		var index_2 = file_condition.variables[1].variables[0];
		var cond_1 = file_condition.variables[0].variables[1];
		var cond_2 = file_condition.variables[1].variables[1];
		var result_1 = con_evaluation(op_1, index_1, cond_1);
		var result_2 = con_evaluation(op_2, index_2, cond_2);
		console.log('(' + index_1 + ' ' + op_1 + ' ' + cond_1 + ' --> ' + result_1 + ') && (' +
			index_2 + ' ' + op_2 + ' ' + cond_2 + ' --> ' + result_2 + ')\n');
		if(result_1 == 1 && result_2 == 1)
			return (true);
		else 
			return (false);*/
	}
	else if (file_condition.operation == '||')
	{
		var op = [];
		var index = [];
		var cond = [];
		var result = []
		
		for (var i = 0; i < file_condition.variables.length; i++)
		{
			op.push(file_condition.variables[i].operation);
			index.push(file_condition.variables[i].variables[0]);
			cond.push(file_condition.variables[i].variables[1]);
			result.push(con_evaluation(op[i], index[i], cond[i]));
		}
		
		for (var i = 0; i < file_condition.variables.length-1; i++)
			console.log('(' + index[i] + ' ' + op[i] + ' ' + cond[i] + ' --> ' + result[i] + ') || ');
			
		console.log('(' + index[file_condition.variables.length-1] + ' ' + op[file_condition.variables.length-1] + ' ' + 
			cond[file_condition.variables.length-1] + ' --> ' + result[file_condition.variables.length-1] + ')\n');	
			
		for (var i = 0; i < file_condition.variables.length; i++)
		{
			if(result[i] == 1)
				return (true);
		}
		return (false);
	}
	else
	{
		if (file_condition.variables == true)
			return true;
		else {
			var op = file_condition.operation;
			var index = file_condition.variables[0];
			var cond = file_condition.variables[1];
			var result = con_evaluation(op, index, cond);
			console.log(index + ' ' + op + ' ' + cond + ' --> ' + result + '\n');
			if(result == 0)
				return (false);
			else 
				return (true);
		}
	}

}


function con_evaluation(op, index, cond) 
{
	switch(op)
	{
		case '==':
			var result = index_eq_evaluation(index, cond);
			return result;
			break;
		case '!=':
			var result = index_not_eq_evaluation(index, cond);
			return result;
			break;
		case '<':
			var result = index_lt_evaluation(index, cond);
			return result;
			break;
		case '>':
			var result = index_gt_evaluation(index, cond);
			return result;
			break;
	}
}


function index_eq_evaluation(index, cond) 
{
	var result = 0;
	switch(index)
	{
		case 'temp':
			if(temp == cond)
				result = 1;
			return (result);
			break;	
		case 'hum':
			if(hum == cond)
				result = 1;
			return (result);
			break;	
		case 'tilt':
			if(tilt == cond)
				result = 1;
			return (result);
			break;	
		case 'ldr':
			if(ldr == cond)
				result = 1;
			return (result);
			break;	
		case 'intrust_time':
			var hours = new Date();
			console.log('Time: ' + hours.getHours() + ':' + hours.getMinutes());
			if (hours.getHours() == cond && hours.getMinutes() == '00')
				result = 1;
			return (result);
			break;
	}
}


function index_not_eq_evaluation(index, cond) 
{
	var result = 0;
	switch(index)
	{
		case 'temp':
			if(temp != cond)
				result = 1;
			return (result);
			break;	
		case 'hum':
			if(hum != cond)
				result = 1;
			return (result);
			break;	
		case 'tilt':
			if(tilt != cond)
				result = 1;
			return (result);
			break;	
		case 'ldr':
			if(ldr != cond)
				result = 1;
			return (result);
			break;	
		case 'intrust_time':
			var hours = new Date();
			console.log('Time: ' + hours.getHours() + ':' + hours.getMinutes());
			if (hours.getHours() != cond && hours.getMinutes() == '00')
				result = 1;
			return (result);
			break;
	}
}


function index_lt_evaluation(index, cond) 
{
	var result = 0;
	switch(index)
	{
		case 'temp':
			if(temp < cond)
				result = 1;
			return (result);
			break;	
		case 'hum':
			if(hum < cond)
				result = 1;
			return (result);
			break;	
		case 'ldr':
			if(ldr < cond)
				result = 1;
			return (result);
			break;	
		case 'intrust_time':
			var hours = new Date();
			console.log('Time: ' + hours.getHours() + ':' + hours.getMinutes());
			if (hours.getHours() < cond)
				result = 1;
			return (result);
			break;
	}
}


function index_gt_evaluation(index, cond) 
{
	var result = 0;
	switch(index)
	{
		case 'temp':
			if(temp > cond)
				result = 1;
			return (result);
			break;	
		case 'hum':
			if(hum > cond)
				result = 1;
			return (result);
			break;	
		case 'ldr':
			if(ldr > cond)
				result = 1;
			return (result);
			break;	
		case 'intrust_time':
			var hours = new Date();
			console.log('Time: ' + hours.getHours() + ':' + hours.getMinutes());
			if (hours.getHours() > cond || (hours.getHours() == cond && hours.getMinutes() > '00'))
				result = 1;
			return (result);
			break;
	}
}


function absolute_time(h, m, s)
{
	var time;
	if (m == 'inf')
		time = 100000*100000;
	else
		time = s + (m*60) + (h*3600);
	return (time);
}

function before_A_Win(tCreation, minA)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if(currentTime <= (tCreation + minA))
		return (true);
	else
		return (false);
}

function in_A_Win(tCreation, minA, maxA)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if((currentTime > (tCreation + minA)) && (currentTime <= (tCreation + maxA)))
		return (true);
	else
		return (false);
}

function after_A_Win(tCreation, maxA)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if(currentTime >= (tCreation + maxA))
		return (true);
	else
		return (false);
}

function before_C_Win(tReference, minC)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if(currentTime <= (tReference + minC))
		return (true);
	else
		return (false);
}

function in_C_Win(tReference, minC, maxC)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if((currentTime > (tReference + minC)) && (currentTime <= (tReference + maxC)))
		return (true);
	else
		return (false);
}

function after_C_Win(tReference, maxC)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if(currentTime >= tReference + maxC)
		return (true);
	else
		return (false);
}

function saveInTheDatabase(headers, url, method, value)
{
	var options = {
		url: 'http://localhost:3000/' + url,
		method: method,
		headers: headers,
		form: value
	}
	var child = fork.fork('./request.js', options);
	child.send(options);
}
