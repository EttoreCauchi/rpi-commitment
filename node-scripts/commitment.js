var JSONMath = require('json-logic');
var fs = require('fs');
var Stately = require('stately.js');
var sleep = require('sleep');
var request = require('request');
const fork = require('child_process');

//TODO
var temp = 0;
var hum = 0;
var tilt = true;
var ldr;
var commitWin = true; //it becomes false if the button is pressed
var hours = 0.5;

class Commit
{

	initializeCommit(file)
	{
		var monitoring = fsm_status();

		var creationDate = new Date();
		var tCreation = absolute_time(creationDate.getHours(), creationDate.getMinutes(), creationDate.getSeconds());

		var ant_logic = new JSONMath;
		var con_logic = new JSONMath;
		var thereIsAntecedent = false;

		var type = file.commitment.type;

		console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());


		//Save the status on the database
		var headers = {
			'Id': file.commitment.smartObject.id
		}			

		var options = {
			url: 'http://localhost:3000/commitments',
			method: 'POST',
			headers: headers,
			form: {'status': monitoring.getMachineState()}
		}
		var child = fork.fork('./request.js', options);
		child.send(options);

		if(file.commitment.antecedentCondition.variables != true)
		{
			thereIsAntecedent = true;
			var ant_res = ant_logic.execute({
			    "antecedent": file.commitment.antecedentCondition
			});
			var maxA = absolute_time(0, file.commitment.antecedentCondition.maxA, 0);
			var minA = absolute_time(0, file.commitment.antecedentCondition.minA, 0);
			monitoring.tick_c();
		}
		else
		{
			console.log('NO ANTECEDENT');
			monitoring.tick_c();
			monitoring.tick_d();
			var detachDate = new Date();
			var tDetaching = absolute_time(detachDate.getHours(), detachDate.getMinutes(), detachDate.getSeconds());
		}
		var con_res = con_logic.execute({
		    "consequent": file.commitment.consequentCondition
		});
		var maxC = absolute_time(0, file.commitment.consequentCondition.maxC, 0);
		var minC = absolute_time(0, file.commitment.consequentCondition.minC, 0);

		//ant_res.antecedent = commitmentEvaluation(file.commitment.antecedentCondition);
		//con_res.consequent = commitmentEvaluation(file.commitment.consequentCondition);

		console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());

		//Save the new status on the database
		options = {
			url: 'http://localhost:3000/commitments',
			method: 'PUT',
			headers: headers,
			form: {'status': monitoring.getMachineState()}
		}
		child = fork.fork('./request.js', options);
		child.send(options);


		//booleano che ci indica quando stare e uscire dal while (in realtà il bottoncino fa la stessa cosa)
		var processing = true;

		while(processing)
		{
			//AGGIORNARE I VALORI CHE PROVENGONO DAI SENSORI TODO

			if(monitoring.getMachineState() == 'CONDITIONAL')
			{
				if(after_A_Win(tCreation, maxA))
				{
					monitoring.tick_e();
					console.log('ID ' + file.commitment.smartObject.id + 
						': ' + monitoring.getMachineState());

					//Save the new status on the database
					options = {
						url: 'http://localhost:3000/commitments',
						method: 'PUT',
						headers: headers,
						form: {'status': monitoring.getMachineState()}
					}
					child = fork.fork('./request.js', options);
					child.send(options);

					processing = false;
				}
				else if(commitWin == false)
				{
					monitoring.tick_t();
					console.log('ID ' + file.commitment.smartObject.id + 
						': ' + monitoring.getMachineState());

					//Save the new status on the database
					options = {
						url: 'http://localhost:3000/commitments',
						method: 'PUT',
						headers: headers,
						form: {'status': monitoring.getMachineState()}
					}
					child = fork.fork('./request.js', options);
					child.send(options);

					processing = false;
				}
				else
				{	
					ant_res.antecedent = commitmentEvaluation(file.commitment.antecedentCondition);
					if(before_A_Win(tCreation, minA) || (in_A_Win(tCreation, minA, maxA) && ant_res.antecedent == false))
					{
						monitoring.tick_c();
						console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());
						//No sense to update the status on the database
					}
					else if(in_A_Win(tCreation, minA, maxA) && ant_res.antecedent == true)
					{
						monitoring.tick_d();
						console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());

						//Save the new status on the database
						options = {
							url: 'http://localhost:3000/commitments',
							method: 'PUT',
							headers: headers,
							form: {'status': monitoring.getMachineState()}
						}
						child = fork.fork('./request.js', options);
						child.send(options);

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

					//Save the new status on the database
					options = {
						url: 'http://localhost:3000/commitments',
						method: 'PUT',
						headers: headers,
						form: {'status': monitoring.getMachineState()}
					}
					child = fork.fork('./request.js', options);
					child.send(options);

					processing = false
				}
				else if(type == 'persistent' && after_C_Win(tCreation, maxC))
				{
					monitoring.tick_s();
					console.log('\nID ' + file.commitment.smartObject.id + 
						': ' + monitoring.getMachineState());

					//Save the new status on the database
					options = {
						url: 'http://localhost:3000/commitments',
						method: 'PUT',
						headers: headers,
						form: {'status': monitoring.getMachineState()}
					}
					child = fork.fork('./request.js', options);
					child.send(options);

					processing = false;
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

						//Save the new status on the database
						options = {
							url: 'http://localhost:3000/commitments',
							method: 'PUT',
							headers: headers,
							form: {'status': monitoring.getMachineState()}
						}
						child = fork.fork('./request.js', options);
						child.send(options);

						processing = false;
					}
					else if(type == 'goal' && con_res.consequent == true && in_C_Win(tCreation, minC, maxC)) //NON BASTA, IL TASTINO DEV'ESSERE PREMUTO
					{
						monitoring.tick_s();
						console.log('\nID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());

						//Save the new status on the database
						options = {
							url: 'http://localhost:3000/commitments',
							method: 'PUT',
							headers: headers,
							form: {'status': monitoring.getMachineState()}
						}
						child = fork.fork('./request.js', options);
						child.send(options);

						processing = false;
					}
					else if(before_C_Win(tCreation, minC) || (in_C_Win(tCreation, minC, maxC) && ((type == 'goal' && con_res.consequent == false) || 
						(type == 'persistent' && con_res.consequent == true))))
					{
						monitoring.tick_d();
						console.log('ID ' + file.commitment.smartObject.id + 
							': ' + monitoring.getMachineState());
						//No sense to update the status on the database
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

				//Save the new status on the database
				options = {
					url: 'http://localhost:3000/commitments',
					method: 'PUT',
					headers: headers,
					form: {'status': monitoring.getMachineState()}
				}
				child = fork.fork('./request.js', options);
				child.send(options);
			}
			sleep.sleep(3);
		} //end while



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
