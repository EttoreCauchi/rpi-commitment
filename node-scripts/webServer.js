class ServerWeb {

	create() {

		const express = require('express');
		const MongoClient = require('mongoose');
		const bodyParser = require('body-parser');
		const app = express();

		//app.use(bodyParser.urlencoded({ extended: true }));
		//app.use(bodyParser.json());

		//app.use('/Commitments', require('./api'));

		app.listen(3000);
		console.log('API is running on port 3000');
	}
}
exports.ServerWeb = ServerWeb;
