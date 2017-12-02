var fs = require('fs');
var sleep = require('sleep');
const fork = require('child_process');

module.exports = function(app) {
	const express = require('express');
	app.use(express.static('/home/pi/rpi-commitment/GUI_Commitments'));
	app.use(express.static('/home/pi/rpi-commitment/GUI_Commitments/img'));
	var img = 'EggsChor.gif'

	app.post('/evaluate', (req, res) => {
		if (req.body.button == 'oneOrder') {
		}
		else if (req.body.button == 'oneContract') {
			img = 'EggsChor_01.gif';
		}
		else if (req.body.button == 'twoOrderInstruction') {
			img = 'EggsChor_02.gif';
		}
		else if (req.body.button == 'threeEggs') {
			img = 'EggsChor_03.gif';
			//Fai partire C2c
			postToRasp('start_commitment', 'POST', {'commitment':'C2c'});
			//Fai partire C3c
			postToRasp('start_commitment', 'POST', {'commitment':'C3c'});

		}
		else if (req.body.button == 'fourEggs') {
			//Fai partire C4c
			postToRasp('start_commitment', 'POST', {'commitment':'C4c'});
		}
		else if (req.body.button == 'fourSign') {
			img = 'EggsChor_04.gif';
			//Stoppa C3c
			postToRasp('end_commitment', 'POST', {'commitment':'C3c'});
			//Stoppa C4c
			postToRasp('end_commitment', 'POST', {'commitment':'C4c'});
		}
		else if (req.body.button == 'fiveNotification') {
			img = 'EggsChor_05.gif';
			//Stoppa C2c
			postToRasp('end_commitment', 'POST', {'commitment':'C2c'});
		}
		setTimeout((function() {res.redirect('/home')}), 1000);
	});

	app.get('/', (req, res) => {
		app.set('view engine', 'ejs');
		res.render('/home/pi/rpi-commitment/GUI_Commitments/golden_eggs', {
			img : img
		});
	});
	
	app.get('/home', (req, res) => {
		app.set('view engine', 'ejs');
		res.render('/home/pi/rpi-commitment/GUI_Commitments/golden_eggs', {
			img : img
		});
	});
	
	function postToRasp(url, method, value)
	{
		var options = {
			url: 'http://localhost:3000/' + url,
			method: method,
			form: value
		}
		var child = fork.fork('./request.js');
		child.send(options);
	}
		
};
