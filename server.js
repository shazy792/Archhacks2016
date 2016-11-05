var express = require('express');
var app = express();
var mongoose = require('mongoose');


var bodyParser = require('body-parser');
var methodOverride = require('method-override'); // lets us use PUT and DELETE even if client doesn't support it





var auth = jwt({secret: process.env.SECRET, userProperty: 'payload'});



app.use(express.static(__dirname + '/dist')); // set the static files location /public/img will be /img for users
app.use(passport.initialize());

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());


app.get('*', function(req, res) {

    res.sendfile('./dist/index.html'); // loads the single view file (angular)

});

app.listen(process.env.PORT || 3000);
console.log("App listening on port 3000");
