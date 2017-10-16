module.exports = function(app, db) {
	app.post('/commitments', (req, res) => {
		const note = {_id: req.headers.id, text: req.body.status};
		var userCollection = db.collection('commits');
		userCollection.insert(note, (err, result) => {
			if(err){
				res.send({'error': 'Error occurred'});	
			} else {
				res.send(result.ops[0]);
			}
		});	
	});
	
	app.get('/commitments/:id', (req, res) => {
		const id = req.params.id;
		const details = { '_id': id };
		db.collection('commits').findOne(details, (err, item) => {
			if(err) {
				res.send({'error': 'Error occurred'});
			} else {
				res.send('<font size="16">' + 'Commitment ID:  ' + item._id + '</br></br>Commitment Status:  ' + item.text + '</font>');
			}
		});
	});

	app.put('/commitments', (req, res) => {
		const id = req.headers.id;
		const details = { '_id': id };
		const note = {$set: {text: req.body.status}};
		db.collection('commits').update(details, note, (err, result) => {
			if(err) {
				res.send({'error': 'Error occurred'});
			} else {
				res.jsonp(id);
			}
		});
	});
};

