var JSONMath = require('json-logic');
var fs = require('fs');
var Stately = require('stately.js');
var sleep = require('sleep');
const fork = require('child_process');
var config = require('../config/settings');
var zmq = require('zeromq');
var sock = zmq.socket('sub');

var address = config.sensor.address.host;
var port = config.sensor.address.port;

sock.connect('tcp://' + address + ':' + port);
		
//TODO
var temp;
var hum;
var tilt = 'False';
var ldr;
var commitWin = true; //it becomes false if the button is pressed
var hours = 0.5;

class Commit
{

	initializeCommit(file)
	{
		//Subscribtion only to the sensors in the commitment
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
				sock.subscribe('temp');
				sock.subscribe('hum');
			}
			if (file.commitment.antecedentCondition.variables[0].variables[0] == 'tilt' ||
				file.commitment.antecedentCondition.variables[1].variables[0] == 'tilt' ||
					file.commitment.consequentCondition.variables[0].variables[0] == 'tilt' ||
						file.commitment.consequentCondition.variables[1].variables[0] == 'tilt')
			{
				sock.subscribe('tilt');
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
			if (file.commitment.antecedentCondition.variables[0] == 'tilt' ||
				file.commitment.consequentCondition.variables[0] == 'tilt')
			{
				sock.subscribe('tilt');
			}
		}
		
		//Initialize states machine
		var monitoring = fsm_status();

		var creationDate = new Date();

		var ant_logic = new JSONMath;
		var con_logic = new JSONMath;
		var thereIsAntecedent = false;

		var type = file.commitment.type;

		console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());

		if(file.commitment.antecedentCondition.variables != true)
		{
			thereIsAntecedent = true;
			var ant_res = ant_logic.execute({
			    "antecedent": file.commitment.antecedentCondition
			});
			var maxA = absolute_time(0, file.commitment.antecedentCondition.maxA, 0);
			var minA = absolute_time(0, file.commitment.antecedentCondition.minA, 0);
			monitoring.tick_c();
			//DA COLLEGARE A REST (INIZIO COMMITMENT)
			var tCreation = absolute_time(creationDate.getHours(), creationDate.getMinutes(), creationDate.getSeconds());
		}
		else
		{
			console.log('NO ANTECEDENT');
			monitoring.tick_c();
			monitoring.tick_d();
			var detachDate = new Date();
			var tDetaching = absolute_time(detachDate.getHours(), detachDate.getMinutes(), detachDate.getSeconds());
			//DA COLLEGARE A REST (INIZIO COMMITMENT)
			var tCreation = absolute_time(creationDate.getHours(), creationDate.getMinutes(), creationDate.getSeconds());
		}
		var con_res = con_logic.execute({
		    "consequent": file.commitment.consequentCondition
		});
		var maxC = absolute_time(0, file.commitment.consequentCondition.maxC, 0);
		var minC = absolute_time(0, file.commitment.consequentCondition.minC, 0);

		console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());

		sock.on('message', function (topic, message)
		{
			//AGGIORNARE I VALORI CHE PROVENGONO DAI SENSORI TODO
			if(topic.toString('utf8') === config.sensor.topic.temperature)
			{
				temp = message.toString('utf8');
				console.log('Temp : ' + temp);
			}
			else if (topic.toString('utf8') === config.sensor.topic.humidity)
			{
				hum = message.toString('utf8');
				console.log('Hum : ' + hum);
			}
			else if (topic.toString('utf8') === config.sensor.topic.simpleinclination)
			{
				tilt = message.toString('utf8');
				console.log('Tilt : ' + tilt);
			}
			else if (topic.toString('utf8') === config.sensor.topic.brightness)
			{
				ldr = message.toString('utf8');
				console.log('Ldr : ' + ldr);
			}
			
			//Conditions evaluation
			if(monitoring.getMachineState() == 'CONDITIONAL')
			{
				if(after_A_Win(tCreation, maxA))
				{
					monitoring.tick_e();
					console.log('ID ' + file.commitment.smartObject.id + 
						': ' + monitoring.getMachineState());
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else if(commitWin == false)
				{
					monitoring.tick_t();
					console.log('ID ' + file.commitment.smartObject.id + 
						': ' + monitoring.getMachineState());
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else
				{	
					ant_res.antecedent = commitmentEvaluation(file.commitment.antecedentCondition);
					if(before_A_Win(tCreation, minA) || (in_A_Win(tCreation, minA, maxA) && ant_res.antecedent == false))
					{
						monitoring.tick_c();
						console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());
					}
					else if(in_A_Win(tCreation, minA, maxA) && ant_res.antecedent == true)
					{
						monitoring.tick_d();
						console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());
						var detachDate = new Date();
						var tDetaching = absolute_time(detachDate.getHours(), detachDate.getMinutes(), detachDate.getSeconds());
					}
				}
				//TODO: SE ARRIVA UN SEGNALE DI RELEASE VA IN TERMINATED, DI CANCEL VA IN TERMINATED
			}
			if(monitoring.getMachineState() == 'DETACHED')
			{
				if(commitWin == false)
				{
					monitoring.tick_v();
					console.log('ID ' + file.commitment.smartObject.id + 
						': ' + monitoring.getMachineState());
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else if(type == 'persistent' && after_C_Win(tCreation, maxC))
				{
					monitoring.tick_s();
					console.log('ID ' + file.commitment.smartObject.id + 
						': ' + monitoring.getMachineState());
					sock.disconnect('tcp://' + address + ':' + port);
				}
				else
				{
					con_res.consequent = commitmentEvaluation(file.commitment.consequentCondition);
					if((type == 'persistent' && in_C_Win(tCreation, minC, maxC) && con_res.consequent == false) ||
						(type == 'goal' && after_C_Win(tCreation, maxC)))
					{
						monitoring.tick_v();
						console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());
						sock.disconnect('tcp://' + address + ':' + port);
					}
					else if(type == 'goal' && con_res.consequent == true && in_C_Win(tCreation, minC, maxC)) 
					{
						monitoring.tick_s();
						console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());
						sock.disconnect('tcp://' + address + ':' + port);
					}
					else if(before_C_Win(tCreation, minC) || (in_C_Win(tCreation, minC, maxC) && ((type == 'goal' && con_res.consequent == false) || 
						(type == 'persistent' && con_res.consequent == true))))
					{
						monitoring.tick_d();
						console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());
					}
				}
				//TODO: SE ARRIVA UN SEGNALE DI SUSPEND VA IN PENDING, DI RELEASE VA IN TERMINATED, DI CANCEL VA IN VIOLATED
			}
			if(monitoring.getMachineState() == 'PENDING')
			{
				//SE ARRIVA UN SEGNALE DI REACTIVATE 
				monitoring.reactivated();
				console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());
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
	 	'calcel':   /* => */ 'VIOLATED',
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
			return (false);
	}
	else if (file_condition.operation == '||')
	{
		var op_1 = file_condition.variables[0].operation;
		var op_2 = file_condition.variables[1].operation;
		var index_1 = file_condition.variables[0].variables[0];
		var index_2 = file_condition.variables[1].variables[0];
		var cond_1 = file_condition.variables[0].variables[1];
		var cond_2 = file_condition.variables[1].variables[1];
		var result_1 = con_evaluation(op_1, index_1, cond_1);
		var result_2 = con_evaluation(op_2, index_2, cond_2);
		console.log('(' + index_1 + ' ' + op_1 + ' ' + cond_1 + ' --> ' + result_1 + ') || (' +
			index_2 + ' ' + op_2 + ' ' + cond_2 + ' --> ' + result_2 + ')\n');
		if(result_1 == 0 && result_2 == 0)
			return (false);
		else 
			return (true);
	}
	else
	{
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
		case 'completed_in_hours':
			if (hours == cond)
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
		case 'completed_in_hours':
			if (hours != cond)
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
		case 'completed_in_hours':
			if (hours < cond)
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
		case 'completed_in_hours':
			if (hours > cond)
				result = 1;
			return (result);
			break;
	}
}


function absolute_time(h, m, s)
{
	var time = s + (m*60) + (h*3600);
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

function before_C_Win(tCreation, minC)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if(currentTime <= (tCreation + minC))
		return (true);
	else
		return (false);
}

function in_C_Win(tCreation, minC, maxC)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if((currentTime > (tCreation + minC)) && (currentTime <= (tCreation + maxC)))
		return (true);
	else
		return (false);
}

function after_C_Win(tCreation, maxC)
{
	var date = new Date();
	var currentTime = absolute_time(date.getHours(), date.getMinutes(), date.getSeconds())
	if(currentTime >= tCreation + maxC)
		return (true);
	else
		return (false);
}
