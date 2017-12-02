const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

require('./server_routes')(app);
app.listen(8080);
console.log('API is running on port 8080');
