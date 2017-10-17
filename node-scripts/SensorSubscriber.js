var Rx = require('rxjs/Rx');
var config = require('../config/settings');

var zmq = require('zeromq')
    , sock = zmq.socket('sub');

var address = config.sensor.address.host;
var port = config.sensor.address.port;


class SensorSubscriber {
    constructor(topics) {
        sock.connect('tcp://' + address + ':' + port);
        this.topics = topics;
        this.measures = [];
        // for each topic(that is a sensor measure) we create an array of Subject(special Observable which can multicast events)
        this.topics.array.forEach(function (element, index) {
            sock.subscribe(element);
            this.measures[index] = new Rx.Subject();
            console.log('subscribed to ' + element + " at index " + index);
        });
        // receiving a message triggers
        sock.on('message', function (topic, message) {
            this.measures[topics.indexOf(topic.toString('utf8'))].next(message.toString('utf8'));
        });
    }

    //emit complete message for specified sensor
    //to verify if is necessary
    complete(measure) {
        this.measures[topics.indexOf(measure)].complete();
    }

    //measure from config list of available sensor
    extract(measure) {
        var obs = this.measures[topics.indexOf(measure)]
            .pluck(measure);                                        //maybe it can be used map(x=>x.measure) for extractin properties
        return obs;
    }

    //not sure if works, should complete first?
    finalMax(measure) {
        var subscription = extract(measure)
            .max()
            .subscribe(x => console.log(x));
        return subscription;
    }

    //not sure if works
    finalMin(measure) {
        var subscription = extract(measure)
            .min()
            .subscribe(x => console.log(x));
        return subscription;
    }


    //da verificare se restituire subscription o variabili...!!!

    //disjointed buffer
    //it can be done with windowCount too...
    avgByElement(measure, number) {
        var avg;
        var subscription = extract(measure)
            .bufferCount(number)
            .subscribe(function (x) {
                avg = x.reduce(function (tot, elem) {
                    return tot + elem;
                }) / num;
                console.log(avg);
            });
        return subscription;
    }

    //overlapped buffer, overlapping = bufdim
    avgByElementOverlapped(measure, number, bufdim) {
        var avg;
        var subscription = extract(measure)
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
        var subscription = extract(measure)
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
        var last;
        var subscription = extract(measure).subscribe({
            next: (v) => console.log(v),last=v
        });
        return subscription;
    }

}

module.exports = SensorSubscriber;