class TempHumPublisher {
    constructor(sock) {
        this.config = require('../config/settings');
        //this.zmq = require('zeromq');
        this.sock = sock;
        this.rpiDhtSensor = require('rpi-dht-sensor');
    }


    sense() {
		console.log('Ping is online');
		var sock = this.sock;
        function read() {
            //publish every 3.5 seconds
			sock.send(['Ping', 'Ping']);
			//time expressed by ms!!
            setTimeout(read, 3500);
        };
        read();
    }
}

module.exports = TempHumPublisher;
