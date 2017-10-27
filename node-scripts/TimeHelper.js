class TimeHelper {
    constructor(sock) {
        this.zmq = require('zeromq');
        this.sock = sock;
        console.log('TimeHelper online');
    }
    
    setExpiringByElapsedTime(commitID, event, seconds) {
        var sock = this.sock;
        var timeout=setTimeout(sock.send([commitID, event]),seconds*1000);
        clearTimeout(timeout);
    }

    //date must be a date object!
    setExpiringByDate(commitID, event, date) {
        var now = new Date();
        var sock = this.sock;
        var dateInMs = date.getTime();
        now= now.getTime();
        //if the date is actuallly in the future
        if (dateInMs>now){
            var timeout=setTimeout(sock.send([commitID, event]),dateInMs-now);
            clearTimeout(timeout);
        } else {
            sock.send([commitID, event]);
        }
        
        
    }
}

module.exports = TimeHelper;