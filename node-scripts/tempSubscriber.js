
var zmq = require('zeromq')
    , sock = zmq.socket('sub');

var address = config.get('Sensor.address.host');
var port = config.get('Sensor.address.port');
var topic = config.get('Sensor.topic.temp');


sock.connect('tcp://' + address + ':' + port);
sock.subscribe(topic);
console.log('subscriber connected to port:' + port);

sock.on('message', function (topic, message) {
    console.log(message.toString('utf8'));
});