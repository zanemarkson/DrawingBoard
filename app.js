// This is the server-side file of our mobile remote controller app.
// It initializes socket.io and a new express instance.
// Start it by running 'node app.js' from your terminal.


// Creating an express server

var express = require('express'),
	app = express();

// This is needed if the app is run on heroku and other cloud providers:

var port = process.env.PORT || 8080;

// Initialize a new socket.io object. It is bound to 
// the express app, which allows them to coexist.

var io = require('socket.io').listen(app.listen(port));


// App Configuration

// Make the files in the public folder available to the world
app.use(express.static(__dirname + '/'));


// This is a secret key that prevents others from opening your presentation
// and controlling it. Change it to something that only you know.

var secret = 'fullstack';

// Initialize a new socket.io application

var presentation = io.on('connection', function (socket) {

	// A new client has come online. Check the secret key and 
	// emit a "granted" or "denied" message.

	socket.on('load', function(data){

		socket.emit('access', {
			access: (data.key === secret ? "granted" : "denied")
		});

	});

	// Clients send the 'slide-changed' message whenever they navigate to a new slide.

	socket.on('slide-changed', function(data){

		// Check the secret key again

		if(data.key === secret) {

			// Tell all connected clients to navigate to the new slide
			
			presentation.emit('navigate', {
				hash: data.hash
			});
		}

	});

	socket.on('state-changed', function(data){

		// Check the secret key again

		if(data.key === secret) {

			// Tell all connected clients to navigate to the new slide

			presentation.emit('navigate', {
				//hash: data.hash
                state: data.state
			});
		}

	});

	// Remote Drawing Part

    socket.on('mouse-positioning', function (data) {

        if(data.key === secret) {

            // Tell all connected clients to navigate to the new slide

            console.log(data);

            presentation.emit('get-to-position', data);
        }
    });

    socket.on('mouse-drawing', function (data) {

        if(data.key === secret) {

            // Tell all connected clients to navigate to the new slide

            presentation.emit('keep-drawing', data);
        }
    });

	socket.on('mouse-clearing', function (data) {

		if(data.key === secret) {

			// Tell all connected clients to navigate to the new slide

			presentation.emit('keep-clearing', data);
		}
	});
    
    socket.on('all-clear', function (data) {
        if(data.key === secret) {

            // Tell all connected clients to navigate to the new slide

            presentation.emit('clear-drawing');
        }
    });



});

console.log('Your presentation is running on http://localhost:' + port);