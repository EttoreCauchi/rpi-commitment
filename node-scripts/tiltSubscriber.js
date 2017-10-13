var config = require('../config/settings');

var zmq = require('zeromq')
    , sock = zmq.socket('sub');

var address = config.sensor.address.host;
var port = config.sensor.address.port;
var topic = config.sensor.topic.simpleinclination;


sock.connect('tcp://' + address + ':' + port);
sock.subscribe(topic);
console.log('subscriber connected to port:' + port);

sock.on('message', function (topic, message) {
    console.log(message.toString('utf8'));
});
