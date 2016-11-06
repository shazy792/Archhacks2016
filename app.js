// All the basics + node-restful
var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    //morgan = require('morgan'), //Not using morgan!
    restful = require('node-restful'),
    mongoose = restful.mongoose;

var jsonWebToken = require('jsonwebtoken');
// Twilio Setup
var accountSid = 'ACa93dc2d648868bd6e31a21099a277dbc'; // Your Account SID from www.twilio.com/console
var authToken = 'dca01a9b9dd88ff6750e490eba72c4f7';
// Your Auth Token from www.twilio.com/console
var twilio = require('twilio');
var client = new twilio.RestClient(accountSid, authToken);

var app = express();

app.set('secret', 'myAppSecret');
app.use(express.static(__dirname + '/dist')); // set the static files location /public/img will be /img for users

//app.use(morgan('dev')); //Not using Morgan
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
//app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());

//mongoose.connect("mongodb://localhost/bracelets");
mongoose.connect("mongodb://bracelets:archhacks2016@jello.modulusmongo.net:27017/igosop2E");

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
    emergency: String,
    phone: String,
    medremind: Number
  }))
  .methods(['get', 'post', 'put', 'delete']);

//Restapi.before('get', isAdmin);

Restapi.route('sendtext.get', function(req, res, next){
	client.messages.create({
	    body: 'Did you take your medicine today? If you have Reply with 1, If you can not find your medicine Reply with 2, If there is an emergency Reply with 3',
	    to: '+13128520877',  // Text this number
	    from: '+14782470519' //9 // From a valid Twilio number
	}, function(err, message) {
	    res.status(200).send();
	    console.log(message);
	    if (err) {
	    	console.log(err);
	    }
	    next();
	});
});

Restapi.route('arduino', function(req, res, next){
	Restapi.findOne({
		rfid: req.query.rfid
	}, function(err, user){

		if (err) throw err;
		
		if (user){

			/*var name = user.name ? user.name : "";
			var btype = user.btype ? user.btype : "";
			var weight = user.weight ? user.weight : "";*/
			res.send("name:" + user.name + " Blood Type:" + user.btype + " allergies:" + user.allergies[0]);
			//res.status(200).send();
		} else {
			res.send("Not a user");
			//res.status(200).send();
		}
		next();
	});
});

// Rest for new users and authentication
var Userapi = app.userapi = restful.model('auth', mongoose.Schema({
	username: {type: String, required: true},
	password: {type: String, required: true},
	admin: Boolean
}))
.methods(['get', 'post', 'put', 'delete']);

Userapi.after('post', function(req, res, next){
	Userapi.findOne({
		username: req.body.username
	}, function(err, user){
		if (err) throw err;

		if (!user){
			res.json({success: false, message: "Login Failed"});
		} else if (user) {
			if (user.password != req.body.password) {
				res.json({success: false, message: "Login Failed"});
			} else {
				var token = jsonWebToken.sign(user, app.get('secret'), {
					expiresIn: "1440m"
				});

				res.json({
					success: true,
					message: "Logged in",
					token: token
				});
			}
		}
		next();
	});
});

Userapi.route('login.post', function(req, res, next){
	//res.status(200).send();
	Userapi.findOne({
		username: req.body.username
	}, function(err, user){
		if (err) throw next(err);

		if (!user){
			res.json({success: false, message: "Login Failed"});
		} else if (user) {
			if (user.password != req.body.password) {
				res.json({success: false, message: "Login Failed"});
			} else {
				var token = jsonWebToken.sign(user, app.get('secret'), {
					expiresIn: "1440m"
				});

				res.json({
					success: true,
					message: "Logged in",
					token: token
				});
			}
		}
		next();
	});
});

function isAdmin(req, res, next){
	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	if (token) {
		jsonWebToken.verify(token, app.get('secret'), function(err, dec) {
			if (err) {
				console.log(err);
				res.json({success: false, message: "Authentication failed"});
			} else {
				res.json({success: true, message: "Logged in"});
				next(); // verified jwt
			}
		});
	} else {
		res.json({success: false, message: "Authentication failed"});
	}
}


// Registers the REST on /resources
//Restapi.register(app, '/api');

// Registers the REST on /resources
Restapi.register(app, '/api/rest');
Userapi.register(app, '/api/auth');

app.post('/message', function(req, res){
	
	var resp;
	if (req.body.Body === "1"){
		resp = 'Thankyou';
	} else if (req.body.Body === "2"){
		resp = "Your emergency contact has been contacted to assist you.";
	} else if (req.body.Body) {
		resp = "Your emergency contact has been contacted to assist you.";
	}
	res.send("<Response><Message>" + resp + " Recieved.</Message></Response>");
});

app.get('start/:t', function(req, res){
	client.messages.create({
	    body: 'Did you take your medicine today? If you have Reply with 1, If you can not find your medicine Reply with 2, If there is an emergency Reply with 3',
	    to: '+13128520877',  // Text this number
	    from: '+14782470519' //9 // From a valid Twilio number
	}, function(err, message) {
	    res.status(200).send();
	    console.log(message);
	    if (err) {
	    	console.log(err);
	    }
	    next();
	});
});

app.get('/', function(req, res){
	res.sendfile('./index.html');
});

app.listen(process.env.PORT || 3222, function(){
	console.log("Server Started");
});
