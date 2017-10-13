var fs = require('fs');
const fork = require('child_process');
var chokidar = require('chokidar');
var watcher = chokidar.watch('./Commitments', {ignoreInitial: true});
var {Commit} = require('./commitment');


watcher.on('add', function(path)
{
	var commit = new Commit();
	const n = fork.fork('./chandler.js');
	watcher.close();
	console.log('\nProcess ID : ' + n.pid);
	console.log('New File : ' + path);
	var file = JSON.parse(fs.readFileSync('./' + path, 'utf8'));
	console.log('ID : ' + file.commitment.smartObject.id
		+ '\nCommitment Strenght : ' + file.commitment.strenght
		+ '\nCommitment Type : ' + file.commitment.type);
	commit.initializeCommit(file);
})

require('chokidar').watch('./Commitments', {ignoreInitial: true}).on('add', function(event, path) {});
