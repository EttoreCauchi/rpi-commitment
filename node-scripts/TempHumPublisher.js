//3.3to5.5v,PIN(1L,9L,1R,2R)
//Ground PIN (3R...)

class TempHumPublisher {
    constructor(sock) {
        this.config = require('../config/settings');
        //this.zmq = require('zeromq');
        this.sock = sock;
        this.rpiDhtSensor = require('rpi-dht-sensor');
        this.tempTopic = this.config.sensor.topic.temperature;
        this.humTopic = this.config.sensor.topic.humidity;

        //reading from GPIO4 (4L)
        this.dht = new this.rpiDhtSensor.DHT11(4);
    }


    sense() {
		var count = 0;
		console.log('Temperature and Humidity sensors online');
		var sock = this.sock;
        var tempTopic = this.tempTopic;
        var humTopic = this.humTopic;
        var dht = this.dht;
        function read() {
			count++;
            var readout = dht.read();
            var temp = readout.temperature;
            var hum = readout.humidity;
            //var tempData = "{" + tempTopic + ":" + temp + "}";
            //var humData = "{" + humTopic + ":" + hum + "}";
            //publish by topic
            if(count % 2 == 0)
				sock.send([tempTopic, temp]);
			else
				sock.send([humTopic, hum]);
			//time expressed by ms!!
            setTimeout(read, 2000);
        };
        read();
    }
}

module.exports = TempHumPublisher;
