var fs = require('fs');
var sleep = require('sleep');

module.exports = function(app, db, sock) {
	var details;
	const express = require('express');
	app.use(express.static('/home/pi/rpi-commitment/GUI_Commitments'));
	app.use(express.static('/home/pi/rpi-commitment/GUI_Commitments/img/FSM'));
	app.use(express.static('/home/pi/rpi-commitment/GUI_Commitments/img'));
	var m_id = 1;
	var call_commits = 0;
	var call_sens = 0;
	
	app.post('/commitments', (req, res) => {
		const note = {_id: req.headers.id, text: req.body.status, strength: req.headers.strength, type: req.headers.type};
		var userCollection = db.collection("commits");
		if (call_commits == 0) {
			userCollection.insert({});
			sleep.msleep(500);
			db.collection("commits").drop(function(err, delOK) {
					if(err) throw err;
			});	
			call_commits++;
		}
		sleep.msleep(700);
		userCollection.insert(note, (err, result) => {
			if(err){
				res.send({'error': 'Error occurred'});	
			} else {
				res.send(result.ops[0]);
			}
		});	
	});
	
	app.post('/sensors', (req, res) => {
		var time = new Date();
		var datetext = time.getHours()+":"+time.getMinutes()+":"+time.getSeconds();
		const note = {_id: m_id, time : datetext, text: req.headers.sensor, value: req.body.value};
		var userCollection = db.collection("sens");
		if(call_sens == 0) {
			userCollection.insert({});
			db.collection("sens").drop(function(err, delOK) {
					if(err) throw err;
			});
			call_sens++;
		}
		userCollection.insert(note, (err, result) => {
			if(err){
				res.send({'error': 'Error occurred'});	
			} else {
				res.send(result.ops[0]);
				m_id++;
			}
		});	
	});
	
	app.post('/commitment_status', (req, res) => {
		//TODO: TOGLIERE START UNA VOLTA SISTEMATO IL CODICE
		if (req.body.button == 'start') {
			sock.send([details._id, 'start']);
		}
		else if (req.body.button == 'cancel') {
			sock.send([details._id, 'cancel']);
		}
		else if (req.body.button == 'release') {
			sock.send([details._id, 'release']);
		}
		else if (req.body.button == 'suspend') {
			sock.send([details._id, 'suspend']);
		}
		else if (req.body.button == 'reactivate') {
			sock.send([details._id, 'reactivate']);
		}
		setTimeout((function() {res.redirect('/commitment_status')}), 1500);
	});
	
	app.post('/start_commitment', (req, res) => {
		{
			sock.send([req.body.commitment, 'start']);
		}
	});
	
	app.post('/end_commitment', (req, res) => {
		{
			sock.send([details._id, 'end']);
		}
		setTimeout((function() {res.redirect('/commitment_status')}), 1500);
	});
	
	
	app.get('/commitments/:id', (req, res) => {
		const id = req.params.id;
		details = { '_id': id };
		res.redirect('/commitment_status');
	});

	app.get('/commitment_status', (req, res) => {
		db.collection('commits').findOne(details, (err, item) => {
			if(item === null) {
				res.send('Commitment not found!');
			} else { 
				app.set('view engine', 'ejs');
				var identifier = item._id;
				var status = item.text;
				var strength = capitalizeFirst(item.strength);
				var type = capitalizeFirst(item.type);
				var page = '/home/pi/rpi-commitment/GUI_Commitments/commi_status';
				var photo;
				if(item.text == 'NULL')
					photo = "02.png";
				else if(item.text == 'CONDITIONAL')
					photo = '03.png';
				else if(item.text == 'EXPIRED')
					photo = '04.png';
				else if(item.text == 'TERMINATED')
					photo = '05.png';
				else if(item.text == 'PENDING')
					photo = '06.png';
				else if(item.text == 'DETACHED')
					photo = '07.png';
				else if(item.text == 'VIOLATED')
					photo = '08.png';
				else if(item.text == 'SATISFIED')
					photo = '09.png';
				else (photo = '01.png');
				res.render(page, {
					identifier: identifier,
					status: status,
					strength: strength,
					type: type,
					photo: photo
				});
			}
		});
	});

	app.put('/commitments', (req, res) => {
		const id = req.headers.id;
		details = { '_id': id };
		const note = {$set: {text: req.body.status}};
		db.collection('commits').update(details, note, (err, result) => {
			if(err) {
				res.send({'error': 'Error occurred'});
			} else {
				res.jsonp(id);
			}
		});
	});
	
	app.get('/', (req, res) => {
		res.sendFile('/home/pi/rpi-commitment/GUI_Commitments/home.html');
	});
	
	app.get('/home', (req, res) => {
		res.sendFile('/home/pi/rpi-commitment/GUI_Commitments/home.html');
	});
	
	app.get('/upload_commitment', (req, res) => {
		res.sendFile('/home/pi/rpi-commitment/GUI_Commitments/upload_c.html');
	});
	
	app.get('/insert_detail', (req, res) => {
		var c_id = [];
		db.collection('commits').find().toArray(function(err, result) {
			if (err) throw err;
			for (var x = 0; x < result.length; x++)
			{
				c_id.push(result[x]);
			}
		app.set('view engine', 'ejs');
		res.render('/home/pi/rpi-commitment/GUI_Commitments/insert_detail', {
				c_id : c_id
		});
		});
	});
	
	app.post('/insert_detail', (req, res) => {
		var id = req.body.id;
		res.redirect('/commitments/' + id);
	});
	
	app.get('/sensor_status', (req, res) => {
		var led;
		var tilt;
		var array_temp = [];
		var array_hum = [];
		var array_ldr = [];
				
		db.collection('sens').findOne({'text' : 'tilt'}, {sort:{$natural:-1}}, (err, item) => {
			tilt = item.value;
			if (tilt == 'True')
				led = 'gRedR.gif';
			else
				led = 'gRedG.gif';
					
		db.collection('sens').find({'text' : 'temp'}).toArray(function(err, result) {
			if (err) throw err;
			for (var x = 0; x < result.length; x++)
			{
				array_temp.push(result[x]);
			}
			
		db.collection('sens').find({'text' : 'hum'}).toArray(function(err, result) {
			if (err) throw err;
			for (var x = 0; x < result.length; x++)
			{
				array_hum.push(result[x]);
			}
			
		db.collection('sens').find({'text' : 'ldr'}).toArray(function(err, result) {
			if (err) throw err;
			for (var x = 0; x < result.length; x++)
			{
				array_ldr.push(result[x]);
			}	
		
		app.set('view engine', 'ejs');
		res.render('/home/pi/rpi-commitment/GUI_Commitments/sensor_status', {
			led : led,
			array_ldr : array_ldr,
			array_temp : array_temp,
			array_hum : array_hum
			});	
		});
		});
		});		
		});		
	});
	
	function capitalizeFirst(string) {
			return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
		
};
