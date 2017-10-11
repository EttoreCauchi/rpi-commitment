class TiltPublisher {
    constructor() {
        this.config = require('../config/settings');
        this.util = require('util')
        this.spawn = require('child_process').spawn;
        this.zmq = require('zeromq')
        this.sock = this.zmq.socket('pub');

        //retrieve usefull parameters
        this.host = this.config.sensor.address.host;
        this.port = this.config.sensor.address.port;
        this.topic = this.config.sensor.topic.simpleinclination;
        this.path = '../python-scripts/tilt_switch.py';
    }
    //bind to the socket
    sense() {
        var sock = this.sock;
        var topic = this.topic;
        sock.bindSync('tcp://' + this.host + ':' + this.port);
        console.log('publisher bound to port ' + this.port);
        //starting python script
        var process = this.spawn('python', [this.path]);
        //awaiting for data
        process.stdout.on('data', function (chunk) {
            var textchunk = chunk.toString('utf8');
            //sanitizing from newlines
            textchunk= textchunk.replace('\n', '');        
            //format
            var data = "{"+topic+":"+textchunk+"}";
            //publish by topic
            sock.send([topic, data]);
        });
    }
}





module.exports = TiltPublisher;
