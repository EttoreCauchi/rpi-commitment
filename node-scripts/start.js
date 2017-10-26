var {Handler} = require('./handler');
var {ServerWeb} = require('./webServer');

var handler = new Handler;
var serverWeb = new ServerWeb;

var config = require('../config/settings');
var zmq = require('zeromq');
var sock = zmq.socket('pub');

var host = config.sensor.address.host;
var port = config.sensor.address.port;

sock.bindSync('tcp://' + host + ':' + port);


serverWeb.create(sock);
handler.initializeHandler(sock);
