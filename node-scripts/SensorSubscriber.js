var Rx = require('rxjs/Rx');
var config = require('../config/settings');

var zmq = require('zeromq')
    , sock = zmq.socket('sub');

var address = config.sensor.address.host;
var port = config.sensor.address.port;
var measures = [];
        var last;
        var sleep = require('sleep');




class SensorSubscriber {
    start(topics) {
        sock.connect('tcp://' + address + ':' + port);
        this.topics = topics;
        // for each topic(that is a sensor measure) we create an array of Subject(special Observable which can multicast events)
        this.topics.forEach(function (element, index) {
            sock.subscribe(element);
            measures[index] = new Rx.Subject();
            console.log('subscribed to ' + element + " at index " + index);
        });
        // receiving a message triggers
        sock.on('message', function (topic, message) {
            measures[topics.indexOf(topic.toString('utf8'))].next(message.toString('utf8'));
            
        });        
       
    }

    //emit complete message for specified sensor
    //to verify if is necessary
    complete(measure) {
        measures[topics.indexOf(measure)].complete();
    }

    //measure from config list of available sensor
    extract(measure) {
        var obs = measures[this.topics.indexOf(measure)];
        return obs;
    }

    //not sure if works, should complete first?
    finalMax(measure) {
        var subscription = this.extract(measure)
            .max()
            .subscribe(x => console.log(x));
        return subscription;
    }

    //not sure if works
    finalMin(measure) {
        var subscription = this.extract(measure)
            .min()
            .subscribe(x => console.log(x));
        return subscription;
    }


    //da verificare se restituire subscription o variabili...!!!

    //disjointed buffer
    //it can be done with windowCount too...
    avgByElement(measure, number) {
        var avg;
        var subscription = this.extract(measure)
            .bufferCount(number)
            .subscribe(function (x) {
                avg = x.reduce(function (tot, elem) {
                    return tot + elem;
                }) / number;
                console.log(avg);
            });
        return avg;
    }

    //overlapped buffer, overlapping = bufdim
    avgByElementOverlapped(measure, number, bufdim) {
        var avg;
        var subscription = this.extract(measure)
            .bufferCount(number, bufdim)
            .subscribe(function (x) {
                avg = x.reduce(function (tot, elem) {
                    return tot + elem;
                }) / num;
                console.log(avg);
            });
        return subscription;
    }

    avgByTime(measure, msec) {
        var avg;
        var subscription = this.extract(measure)
            .bufferTime(msec)
            .subscribe(function (x) {
                //count element in a buffer
                var num = Rx.Observable.from(x).count().subscribe(x => console.log("count " + x));
                avg = x.reduce(function (tot, elem) {
                    return tot + elem;
                }) / num;
            });
        return subscription;
    }

    takeLast(measure) {
        last = this.extract(measure).take(1).subscribe(last);
        //.windowCount(1)
        //.subscribe(x=>x.subscribe(function(y){console.log(y);last=y;console.log(last);}));
        //sleep.sleep(2);
        console.log(last);
        return last;
    }

}

module.exports = SensorSubscriber;
