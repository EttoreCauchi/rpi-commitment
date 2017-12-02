var fs = require('fs');
var {Commit} = require('./commitment');

process.on('message', function(file) {

	var commit = new Commit();
	console.log('ID : ' + file.commitment.id
		+ '\nCommitment Strenght : ' + file.commitment.strenght
		+ '\nCommitment Type : ' + file.commitment.type);
	commit.initializeCommit(file);

});
