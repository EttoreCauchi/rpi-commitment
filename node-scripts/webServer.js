class ServerWeb {

	create() {

		const express = require('express');
		const MongoClient = require('mongodb').MongoClient;
		const bodyParser = require('body-parser');
		const app = express();
		const db = require('../config/db');

		app.use(bodyParser.urlencoded({ extended: true }));

		MongoClient.connect(db.url, (err, database) => {
			const note = {_id: '003',text: 'Prova questo!', title: 'Prova'};
			if (err) return console.log(err)
			require('./routes')(app, database); //SE MODIFICATO, DA SISTEMARE ANCHE IN INDEX E APP_ROUTES
			app.listen(3000);
			console.log('API is running on port 3000');
		});

	}
}
exports.ServerWeb = ServerWeb;
