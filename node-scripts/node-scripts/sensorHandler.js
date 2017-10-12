//var TempPublisher = require('./TempPublisher');
//var TiltPublisher = require('./TiltPublisher');
var TempHumPublisher = require('./TempHumPublisher');

var tempHumSensor = new TempHumPublisher();
//var tempSensor = new TempPublisher();
//var tiltSensor = new TiltPublisher();

//tempSensor.sense();
//tiltSensor.sense();
tempHumSensor.sense();


