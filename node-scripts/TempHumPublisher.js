//The module supports only physical GPIO numbering
//3.3to5.5v,PIN(1L,9L,1R,2R)
//Ground PIN (3R...)

class TempHumPublisher {
    constructor() {
        this.config = require('../config/settings');
        this.zmq = require('zeromq')
            , this.sock = zmq.socket('pub');
        this.rpiDhtSensor = require('rpi-dht-sensor');

        this.address = this.config.sensor.address.host;
        this.port = this.config.sensor.address.port;
        this.tempTopic = this.config.sensor.topic.temperature;
        this.humTopic = this.config.sensor.topic.humidity;

        //reading from GPIO2 (2L)
        this.dht = new rpiDhtSensor.DHT11(2);
    }


    sense() {
        var tempTopic = this.tempTopic;
        var humTopic = this.humTopic;
        this.sock.bindSync('tcp://' + this.host + ':' + this.port);
        console.log('publisher bound to port ' + this.port);
        function read() {
            this.readout = this.dht.read();
            var temp = this.readout.temperature.toFixed(2);
            var hum = this.readout.humidity.toFixed(2);
            var tempData = "{" + tempTopic + ":" + temp + " }";
            var humData = "{" + humTopic + ":" + hum + "}";
            //publish by topic
            sock.send([tempTopic, tempData]);
            sock.send([humTopic, humData]);
            console.log('Temperature: ' + temp + 'C, ' + 'humidity: ' + hum + '%');
            //time expressed by ms!!
            setTimeout(read, 5000);
        };
    }
}

module.exports = TempHumPublisher;
