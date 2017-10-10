class TempPublisher {
    constructor() {
        this.config = require('config');
        this.util = require('util');
        this.spawn = require('child_process').spawn;
        this.zmq = require('zeromq')
            , this.sock = zmq.socket('pub');
        //retrieve usefull parameters
        this.address = config.get('Sensor.address.host');
        this.port = config.get('Sensor.address.port');
        this.topic = config.get('Sensor.topic.temperature');
        this.path = '../python-scripts/temp_DS18b20.py';
    }
    //bind to the socket
    sense() {
        sock.bindSync('tcp://' + address + ':' + port);
        console.log('publisher bound to port' + port);
        //starting python script
        this.process = spawn('python', [path]);
        //awaiting for data
        process.stdout.on('data', function (chunk) {
            this.textchunk = chunk.toString('utf8');
            //sanitizing from newlines
            textchunk.replace('\n', '');
            //format
            this.data = JSON.stringify({ topic: textchunk });
            //publish by topic
            sock.send([topic, data]);
            //print for testing
            util.log(data);
        });
    }
}





module.exports = TempPublisher;