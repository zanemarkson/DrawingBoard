
 // Connect to the socket
var socket = io();

var app = angular.module('presentationApp', ['ngRoute']);
app.controller('presentationController', function($scope){

    // Initialize the Reveal.js library with the default config options
    // See more here https://github.com/hakimel/reveal.js#configuration


    // Variable initialization

    $scope.formDisplay = true;
    $scope.inputAnimation = '';
    $scope.blurAtLogin = 'blurred';

    $scope.viewOnly = function () {
        $scope.formDisplay = false;
        $scope.blurAtLogin = '';
        socket.disconnect();
    };

    $scope.submitKey = function(){
        if($scope.key.length) {
            socket.emit('load', {
                key: $scope.key
            });
        }
    };

    var isTouch = function (event){
        var type = event.type;
        return type.indexOf('touch') >= 0;
    };

    // The server will either grant or deny access, depending on the secret key

    socket.on('access', function(data){

        // Check if we have "granted" access.
        // If we do, we can continue with the presentation.

        if(data.access === "granted") {

            // Unblur everything
            $scope.blurAtLogin = '';
            $scope.formDisplay = false;

            var ignore = false;

            Reveal.addEventListener('slidechanged', function(){
                if(ignore){
                    // You will learn more about "ignore" in a bit
                    return;
                }

                var current_state = Reveal.getState();
                socket.emit('state-changed', {
                    key: $scope.key,
                    state: current_state
                });
                
            });

            Reveal.addEventListener('fragmentshown', function(){
                if(ignore){
                    // You will learn more about "ignore" in a bit
                    return;
                }

                var current_state = Reveal.getState();
                socket.emit('state-changed', {
                    key: $scope.key,
                    state: current_state
                });

            });

            Reveal.addEventListener('fragmenthidden', function(){
                if(ignore){
                    // You will learn more about "ignore" in a bit
                    return;
                }

                var current_state = Reveal.getState();
                socket.emit('state-changed', {
                    key: $scope.key,
                    state: current_state
                });

            });

            socket.on('navigate', function(data){

                // Another device has changed its slide. Change it in this browser, too:

                //window.location.hash = data.hash;
                Reveal.setState(data.state);

                // The "ignore" variable stops the hash change from
                // triggering our hashchange handler above and sending
                // us into a never-ending cycle.

                ignore = true;

                setInterval(function () {
                    ignore = false;
                },100);

            });


            // ---> Remote Note Part <--- //


            var isDrawing = false ;
            var isClearing = false ;
            var ignorDrawing = true ;
            var position = {};
            var remoteTouchTimeout = null ;

            var pauseDrawing = function(){
                isDrawing = false ;
                isClearing = false ;
            };

            var sendPosition = function(event){


                if(isTouch(event)){

                    position.x = event.touches[0].pageX;
                    position.y = event.touches[0].pageY;

                    //isDrawing = true;

                    // clearTimeout(remoteTouchTimeout);
                    // remoteTouchTimeout = null ;

                    socket.emit('mouse-positioning', {
                        key: $scope.key,
                        x: position.x,
                        y: position.y,
                        w: window.innerWidth,
                        h: window.innerHeight,
                        button: event.button
                    });

                }
                else{

                    position.x = event.clientX;
                    position.y = event.clientY;

                    if (event.button == 0) {
                        isDrawing = true ;
                        isClearing = false ;
                    }
                    else if (event.button == 2) {
                        isDrawing = false ;
                        isClearing = true ;
                        //alert('Cleaning');
                    }

                    socket.emit('mouse-positioning', {
                        key: $scope.key,
                        x: position.x,
                        y: position.y,
                        w: window.innerWidth,
                        h: window.innerHeight,
                        button: event.button
                    });

                }

            };

            var setPosition = function (data) {

                position.x = data.x / data.w * window.innerWidth;
                position.y = data.y / data.h * window.innerHeight;
            };

            var sendDrawing = function(event){

                ignorDrawing = false ;

                if(isTouch(event)){
                    position.x = event.touches[0].pageX;
                    position.y = event.touches[0].pageY;

                    // clearTimeout(remoteTouchTimeout);
                    // remoteTouchTimeout = null ;
                }
                else{
                    //alert(position);
                    position.x = event.clientX;
                    position.y = event.clientY;

                }

                if(isDrawing){
                    socket.emit('mouse-drawing', {
                        key: $scope.key,
                        x: position.x,
                        y: position.y,
                        w: window.innerWidth,
                        h: window.innerHeight,
                        button: 0
                    });
                }
                else if(isClearing)
                {
                    socket.emit('mouse-clearing',{
                        key: $scope.key,
                        x: position.x,
                        y: position.y,
                        w: window.innerWidth,
                        h: window.innerHeight,
                        button: 2
                    });
                }
            };

            var drawing = function (data) {
                if (!ignorDrawing) return; // Ignore the drawing event echoed back from server;

                if(data.button == 0) {
                    //RevealChalkboard.drawingCanvas.canvas.style.cursor = 'url("' + path + 'img/boardmarker.png") ' + ' auto';
                    RevealChalkboard.drawWithPen(RevealChalkboard.drawingCanvas.context, position.x, position.y, data.x / data.w * window.innerWidth, data.y / data.h * window.innerHeight);
                }
                else if(data.button == 2) {
                    //RevealChalkboard.drawingCanvas.canvas.style.cursor = 'url("' + path + 'img/sponge.png") ' + eraserDiameter + ' ' + eraserDiameter + ', auto';
                    RevealChalkboard.erase(RevealChalkboard.drawingCanvas.context, position.x, position.y);
                }
                position.x = data.x / data.w * window.innerWidth ;
                position.y = data.y / data.h * window.innerHeight ;
            };


            RevealChalkboard.drawingCanvas.canvas.onmousedown = sendPosition ;
            RevealChalkboard.drawingCanvas.canvas.onmousemove = sendDrawing ;
            RevealChalkboard.drawingCanvas.canvas.onmouseup = pauseDrawing ;
            // RevealChalkboard.drawingCanvas.canvas.addEventListener('touchstart', function(evt) {
            //     remoteTouchTimeout = setTimeout(function(){
            //         evt.button = 0 ;
            //         sendPosition(evt);
            //         evt.button = 2 ;
            //         alert('2');
            //     }, 1500 );
            // }, false);
            RevealChalkboard.drawingCanvas.canvas.addEventListener('touchstart', function(evt){
                isClearing = false ;
                isDrawing = true ;
                evt.button = 0;
                remoteTouchTimeout = setTimeout(function(){
                    isClearing = true ;
                    isDrawing = false ;
                    evt.button = 2;
                    sendPosition(evt);
                }, 500);
                sendPosition(evt);
            }, false) ;
            RevealChalkboard.drawingCanvas.canvas.addEventListener('touchmove', function(evt){
                clearTimeout(remoteTouchTimeout);
                remoteTouchTimeout = null ;
                sendDrawing(evt);
            }, false);
            RevealChalkboard.drawingCanvas.canvas.addEventListener('touchend', function(){
                clearTimeout(remoteTouchTimeout);
                remoteTouchTimeout = null ;
                pauseDrawing();
            }, false);
            RevealChalkboard.drawingCanvas.canvas.addEventListener('touchcancel', function(){
                clearTimeout(remoteTouchTimeout);
                remoteTouchTimeout = null ;
                pauseDrawing();
            }, false);
            
            document.getElementById('allClear').addEventListener('click', function () {
                clearTimeout(remoteTouchTimeout);
                remoteTouchTimeout = null ;
                socket.emit('all-clear', {
                    key: $scope.key
                });
            });

            socket.on('clear-drawing', function(){
                RevealChalkboard.reset(true);
            });

            socket.on('get-to-position', function(data){
                setPosition(data);
            });

            socket.on('keep-drawing', function (data) {
                drawing(data);
                setInterval(function () {
                    ignorDrawing = true;
                },100);
            });

            socket.on('keep-clearing', function (data) {
                drawing(data);
                setInterval(function () {
                    ignorDrawing = true;
                },100);
            });





        }
        else {

            // Wrong secret key

            clearTimeout(animationTimeout);

            // Addding the "animation" class triggers the CSS keyframe
            // animation that shakes the text input.

            $scope.inputAnimation = "denied animation";

            $scope.animationTimeout = setTimeout(function(){
                $scope.inputAnimation = '';
            }, 1000);

            $scope.formDisplay = true;
        }

    });

    
});




