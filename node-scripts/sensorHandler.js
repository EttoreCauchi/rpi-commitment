var TempPublisher = require('./TempPublisher');
var TiltPublisher = require('./TiltPublisher');

var tempSensor = new TempPublisher();
var tiltSensor = new TiltPublisher();

tempSensor.sense();
tiltSensor.sense();


