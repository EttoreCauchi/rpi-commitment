var fs = require('fs');
var sleep = require('sleep');

module.exports = function(app, db, sock) {
	var details;
	const express = require('express');
	app.use(express.static('/home/pi/rpi-commitment/GUI_Commitments'));
	var m_id = 1;
	var call_commits = 0;
	var call_sens = 0;
	
	app.post('/commitments', (req, res) => {
		const note = {_id: req.headers.id, text: req.body.status};
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
		const note = {_id: m_id, text: req.headers.sensor, value: req.body.value};
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
				var page = '/home/pi/rpi-commitment/GUI_Commitments/commi_status';
				res.render(page, {
					identifier: identifier,
					status: status
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
		res.sendFile('/home/pi/rpi-commitment/GUI_Commitments/insert_detail.html');
	});
	
	app.post('/insert_detail', (req, res) => {
		var id = req.body.id;
		res.redirect('/commitments/' + id);
	});
	
	app.get('/sensor_status', (req, res) => {
		var temp, hum, tilt, ldr;
		db.collection('sens').findOne({'text' : 'temp'}, {sort:{$natural:-1}}, (err, item) => {
			if (item != null)
				temp = item.value;
			else
				temp = 'ND';
				
		db.collection('sens').findOne({'text' : 'hum'}, {sort:{$natural:-1}}, (err, item) => {
			if (item != null)
				hum = item.value;
			else
				hum = 'ND';
				
		db.collection('sens').findOne({'text' : 'tilt'}, {sort:{$natural:-1}}, (err, item) => {
			if (item != null)
				tilt = item.value;
			else
				tilt = 'ND';
				
		db.collection('sens').findOne({'text' : 'ldr'}, {sort:{$natural:-1}}, (err, item) => {
			if (item != null)
				ldr = item.value;
			else
				ldr = 'ND';
					
		app.set('view engine', 'ejs');
		res.render('/home/pi/rpi-commitment/GUI_Commitments/sensor_status', {
			temp : temp,
			hum : hum,
			tilt : tilt,
			ldr : ldr
			});	
					
		});
		});	
		});		
		});		
	});
	
};
