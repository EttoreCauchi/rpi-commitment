class TempPublisher {
    constructor() {
        this.config = require('../config/settings');
        this.util = require('util');
        this.spawn = require('child_process').spawn;
        this.zmq = require('zeromq');
        this.sock = this.zmq.socket('pub');
        //retrieve usefull parameters
        this.address = this.config.sensor.address;
        this.host = this.config.sensor.address.host;
        this.port = this.config.sensor.address.port;
        this.topic = this.config.sensor.topic.temperature;
        this.path = '../python-scripts/temp_DS18b20.py';
    }
    //bind to the socket
    sense() {
        var sock = this.sock;
        var topic = this.topic;
        console.log(topic);
        sock.connect('tcp://' + this.host + ':' + this.port);
        console.log('publisher bound to port ' + this.port);
        //starting python script
        var process = this.spawn('python', [this.path]);
        console.log(this.path);
        //awaiting for data
        process.stdout.on('data', function (chunk) {
            var textchunk = chunk.toString('utf8');
            console.log(textchunk);
            //sanitizing from newlines
            textchunk = textchunk.replace('\n', '');
            console.log(textchunk);
            //format
            var data = "{"+topic+":"+textchunk+"}";
            //publish by topic
            this.sock.send([topic, data]);
        });
    }
}





module.exports = TempPublisher;
