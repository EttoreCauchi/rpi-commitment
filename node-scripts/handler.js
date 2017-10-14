var fs = require('fs');
const fork = require('child_process');
var chokidar = require('chokidar');
var watcher = chokidar.watch('./Commitments', {ignoreInitial: true});


class Handler {
	initializeHandler() {
	
		watcher.on('add', function(path)
		{

			var file = JSON.parse(fs.readFileSync('./' + path, 'utf8'));
			console.log('\nNew File : ' + path);
			var child = fork.fork('./chandler.js');
			child.send(file);
			console.log('ID process' + child.pid);
			
		})

		require('chokidar').watch('./Commitments', {ignoreInitial: true}).on('add',
 			function(event, path) {});
	}
}
exports.Handler = Handler;
