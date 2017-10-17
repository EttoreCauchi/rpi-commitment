class TiltPublisher {
    constructor(sock) {
        this.config = require('../config/settings');
        this.util = require('util')
        this.spawn = require('child_process').spawn;
        this.zmq = require('zeromq')
        this.sock = sock;

        //retrieve usefull parameters
        this.topic = this.config.sensor.topic.simpleinclination;
        this.path = '../python-scripts/tilt_switch.py';
    }
    //bind to the socket
    sense() {
		console.log('Tilt sensors online');
        var sock = this.sock;
        var topic = this.topic;
        //starting python script
        var process = this.spawn('python', [this.path]);
        //awaiting for data
        process.stdout.on('data', function (chunk) {
            var textchunk = chunk.toString('utf8');
            //sanitizing from newlines
            textchunk= textchunk.replace('\n', '');        
            //format
            var data = textchunk;
            //publish by topic
            sock.send([topic, data]);
        });
    }
}





module.exports = TiltPublisher;
