class TempPublisher {
    constructor() {
        this.config = require('config');
        this.util = require('util');
        this.spawn = require('child_process').spawn;
        this.zmq = require('zeromq');
        this.sock = this.zmq.socket('pub');
        //retrieve usefull parameters
        this.host = this.config.get('Sensor.address.host');
        this.port = this.config.get('Sensor.address.port');
        this.topic = this.config.get('Sensor.topic.temperature');
        this.path = '../python-scripts/temp_DS18b20.py';
    }
    //bind to the socket
    sense() {
        this.sock.bindSync('tcp://' + this.host + ':' + this.port);
        console.log('publisher bound to port' + this.port);
        //starting python script
        process = this.spawn('python', [this.path]);
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





module.exports = TempPublisher;