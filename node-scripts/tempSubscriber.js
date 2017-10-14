var Rx = require('rxjs/Rx');
var config = require('../config/settings');

var zmq = require('zeromq')
    , sock = zmq.socket('sub');

var address = config.sensor.address.host;
var port = config.sensor.address.port;
var topics = [];


sock.connect('tcp://' + address + ':' + port);

//for each "operator" in a_cond ||c_cond ??
topics.push(config.sensor.topic.temperature);
//topics.push(config.sensor.topic.humidity);
topics.push(config.sensor.topic.simpleinclination);

var measures= [];
//the lenght depends on how many topics u pushed
measures.length= 3;


topics.forEach(function(element,index){
		sock.subscribe(element);
		measures[index]= new Rx.Subject();
		console.log('subscribed to '+ element+ " at index "+ index);
	});

sock.on('message', function (topic, message) {
			measures[topics.indexOf(topic.toString('utf8'))].next(message.toString('utf8'));
		});

measures[topics.indexOf(config.sensor.topic.temperature)].subscribe({
		next: (v) => console.log("tempObserver read "+ v)
	});
	
measures[topics.indexOf(config.sensor.topic.simpleinclination)].subscribe({
		next: (v) => console.log("tiltObserver read "+ v)
	});	

//sock.subscribe(topic);
//sock.subscribe(config.sensor.topic.simpleinclination);

/*var temperatures = Rx.Observable.create(function (observer){
		sock.on('message', function (topic, message) {
			observer.next(message.toString('utf8'));
		});
	});*/
	
/*
sock.on('message', function (topic, message) {
    console.log(message.toString('utf8'));
});
*/
//var bufferThree= temperatures.bufferCount(3,1);
//var subscribe = bufferThree.subscribe(val => console.log('Buffered Values:', val));

