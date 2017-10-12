//The module supports only physical GPIO numbering
//3.3to5.5v,PIN(1L,9L,1R,2R)
//Ground PIN (3R...)

class TempHumPublisher {
    constructor() {
        this.config = require('../config/settings');
        this.zmq = require('zeromq');
        this.sock = this.zmq.socket('pub');
        this.rpiDhtSensor = require('rpi-dht-sensor');

        this.host = this.config.sensor.address.host;
        this.port = this.config.sensor.address.port;
        this.tempTopic = this.config.sensor.topic.temperature;
        this.humTopic = this.config.sensor.topic.humidity;

        //reading from GPIO4 (4L)
        this.dht = new this.rpiDhtSensor.DHT11(4);
    }


    sense() {
		var sock = this.sock;
        var tempTopic = this.tempTopic;
        console.log(tempTopic);
        var humTopic = this.humTopic;
        var dht = this.dht;
        sock.bindSync('tcp://' + this.host + ':' + this.port);
        console.log('publisher bound to port ' + this.port);
        function read() {
            var readout = dht.read();
            var temp = readout.temperature.toFixed(2);
            var hum = readout.humidity.toFixed(2);
            console.log(temp);
            var tempData = "{" + tempTopic + ":" + temp + " }";
            console.log(tempData);
            var humData = "{" + humTopic + ":" + hum + "}";
            //publish by topic
            sock.send([tempTopic, tempData]);
            sock.send([humTopic, humData]);
            console.log('Temperature: ' + temp + 'C, ' + 'humidity: ' + hum + '%');
            //time expressed by ms!!
            setTimeout(read, 5000);
        };
        read();
    }
}

module.exports = TempHumPublisher;
