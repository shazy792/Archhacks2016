// All the basics + node-restful
var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    //morgan = require('morgan'), //Not using morgan!
    restful = require('node-restful'),
    mongoose = restful.mongoose;

var app = express();

app.use(express.static(__dirname + '/dist')); // set the static files location /public/img will be /img for users

//app.use(morgan('dev')); //Not using Morgan
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());

mongoose.connect("mongodb://localhost/testt");

// This is the mongo model - Change this!
var Resource = app.resource = restful.model('yo', mongoose.Schema({
    x: Number,
  }))
  .methods(['get', 'post', 'put', 'delete']);

// Registers the REST on /resources 
Resource.register(app, '/d');

app.listen(3000, function(){
	console.log("Server Started");
});