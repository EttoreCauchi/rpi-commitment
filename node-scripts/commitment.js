var fs = require('fs');
var Stately = require('stately.js');
var sleep = require('sleep');

class Commit{

	initialize(file){
		var monitoring = fsm_status();
		console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());
		sleep.sleep(5);
		monitoring.tick_c();
		console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());
		sleep.sleep(5);
		if(file.commitment.smartObject.id == '0002')
		{
			monitoring.tick_d();
			console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());
			monitoring.suspend();
			console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());
			monitoring.reactivated();
			console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());
		}
		if(file.commitment.smartObject.id == '0001')
		{
			monitoring.tick_e();
			console.log('\nID ' + file.commitment.smartObject.id + 
				': ' + monitoring.getMachineState());
		}
	}
}
exports.Commit = Commit;


function fsm_status() {
	var monitoring = Stately.machine({
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
		'tick_s1':  /* => */ 'SATISFIED',
	 	'tick_s2':   /* => */ 'SATISFIED',
		'tick_v1':   /* => */ 'VIOLATED',
	 	'calcel':   /* => */ 'VIOLATED',
		'tick_v2':   /* => */ 'VIOLATED',
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
