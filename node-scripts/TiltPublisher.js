class TiltPublisher {
    constructor() {
        this.config = require('config');
        this.util = require('util')
        this.spawn = require('child_process').spawn;
        this.zmq = require('zeromq')
        this.sock = this.zmq.socket('pub');

        //retrieve usefull parameters
        this.address = this.config.get('Sensor.address.host');
        this.port = this.config.get('Sensor.address.port');
        this.topic = this.config.get('Sensor.topic.simple-inclination');
        this.path = '../python-scripts/tilt_switch.py';
    }
    //bind to the socket
    sense() {
        this.sock.bindSync('tcp://' + this.address + ':' + this.port);
        console.log('publisher bound to port' + this.port);

        //starting python script
        process = this.spawn('python', [path]);
        //awaiting for data
        process.stdout.on('data', function (chunk) {
            textchunk = chunk.toString('utf8');
            //sanitizing from newlines
            textchunk.replace('\n', '');
            //format
            data = JSON.stringify({ topic: textchunk });
            //publish by topic
            this.sock.send([this.topic, data]);
            //print for testing
            this.util.log(data);
        });
    }
}





module.exports = TiltPublisher;
