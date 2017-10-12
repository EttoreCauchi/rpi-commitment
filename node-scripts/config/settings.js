var config =  {};

config.sensor = {};
config.sensor.address = {};
config.sensor.topic = {};

config.sensor.address.host = "127.0.0.1";
config.sensor.address.port = 33333;

config.sensor.topic.temperature = "temp";
config.sensor.topic.humidity = "hum";
config.sensor.topic.simpleinclination = "tilt";
config.sensor.topic.brightness = "ldr";

module.exports = config;
