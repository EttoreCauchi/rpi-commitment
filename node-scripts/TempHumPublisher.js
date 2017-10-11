//The module supports only physical GPIO numbering
//3.3to5.5v,PIN(1L,9L,1R,2R)
//Ground PIN (3R...)

function TempHumPublisher() {
    this.config = require('config');
    this.zmq = require('zeromq')
        , this.sock = zmq.socket('pub');
    this.rpiDhtSensor = require('rpi-dht-sensor');

    this.address = config.get('Sensor.address.host');
    this.port = config.get('Sensor.address.port');
    this.tempTopic = config.get('Sensor.topic.temperature');
    this.humTopic = config.get('Sensor.topic.humidity');

    //reading from GPIO2 (2L)
    this.dht = new rpiDhtSensor.DHT11(2);
};


TempHumPublisher.prototype.sense = function () {
    this.readout = dht.read();
    this.temp = readout.temperature.toFixed(2);
    this.hum = readout.humidity.toFixed(2);
    this.tempData = JSON.stringify({ tempTopic: temp });
    this.humData = JSON.stringify({ humTopic: hum });
    //publish by topic
    sock.send([tempTopic, tempData]);
    sock.send([humTopic, humData]);
    console.log('Temperature: ' + temp + 'C, ' + 'humidity: ' + hum + '%');
    //time expressed by ms!!
    setTimeout(read, 1000);
};


module.exports = TempHumPublisher;
