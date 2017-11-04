var request = require('request');

process.on('message', (msg) => {
	request(msg, function (error, response) {
		if (error) {
			console.log(error);
		}
	})
});
