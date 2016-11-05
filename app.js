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
//app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());

mongoose.connect("mongodb://localhost/bracelets");

// This is the mongo model - Change this!
var Restapi = app.restapi = restful.model('bracelet', mongoose.Schema({
    rfid: String,
    weight: Number,
    height: String,
    name: String,
    age: Number,
    btype: String,
    allergies: [],
    pproblems: [],
    emergency: String
  }))
  .methods(['get', 'post', 'put', 'delete']);

  Restapi.before('get', isAdmin);

  function isAdmin(req, res, next){
  	if (req) { // check authentication over here
  		next();
  	} else {
  		res.send('Not logged in');
  	}
  }


// Registers the REST on /resources
Restapi.register(app, '/api');

app.listen(3000, function(){
	console.log("Server Started");
});
