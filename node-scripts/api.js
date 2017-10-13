var express = require('express');
var router = express.Router();
var http = require('http');
var tjs = require('templatesjs');
var fs = require('fs');

var p = 'products'; // In questo modo posso creare rotte dinamiche in base al nome (ID) del commitment

router.get('/' + p, function(req, res){
	fs.readFile("./index.html", function(err, data) {
		if(err) throw err;
		var out = tjs.setSync(data);
		res.end(out);
	})
});

module.exports = router;
