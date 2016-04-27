
var Remote = ( function(){

// Connect the socket

    var socket = io();

    var key="fullstack";
    var submitKey = function (key) {
        socket = io();
        if(key.length) {
            socket.emit('load', {
                key: key
            });
        }
    };

    var localOnly = function () {
        socket.disconnect();
    };



    socket.on('access', function(data){

        // Check if we have "granted" access.
        // If we do, we can continue with the presentation.

        if(data.access === "granted") {

            // Unblur everything
            // $scope.blurAtLogin = '';
            // $scope.formDisplay = false;

            // var ignore = false;

            // ---> Remote Note Part <--- //

            var isTouch = function (event){
                var type = event.type;
                return type.indexOf('touch') >= 0;
            };

            var isDrawing = false ;
            var isClearing = false ;
            var ignorDrawing = true ;
            var position = {};
            var remoteTouchTimeout = null ;

            var sendPosition = function(event){
                if(isTouch(event)){
                    position.x = event.touches[0].pageX;
                    position.y = event.touches[0].pageY;

                    socket.emit('mouse-positioning', {
                        key: key,
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
                        key: key,
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
                }
                else{
                    //alert(position);
                    position.x = event.clientX;
                    position.y = event.clientY;
                }

                if(isDrawing){
                    socket.emit('mouse-drawing', {
                        key: key,
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
                        key: key,
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
                    DrawingBoard.draw(DrawingBoard.context, position.x, position.y, data.x / data.w * window.innerWidth, data.y / data.h * window.innerHeight);
                }
                else if(data.button == 2) {
                    //RevealChalkboard.drawingCanvas.canvas.style.cursor = 'url("' + path + 'img/sponge.png") ' + eraserDiameter + ' ' + eraserDiameter + ', auto';
                    DrawingBoard.erase(DrawingBoard.context, position.x, position.y);
                }
                position.x = data.x / data.w * window.innerWidth ;
                position.y = data.y / data.h * window.innerHeight ;
            };

            var pauseDrawing = function () {
                isDrawing = false ;
                isClearing = false ;
            }


            // DrawingBoard.pad.onmousedown = sendPosition ;
            // DrawingBoard.pad.onmousemove = sendDrawing ;
            // DrawingBoard.pad.onmouseup = pauseDrawing ;

            DrawingBoard.pad.addEventListener('mousedown', sendPosition, false);
            DrawingBoard.pad.addEventListener('mousemove', sendDrawing, false);
            DrawingBoard.pad.addEventListener('mouseup', pauseDrawing, false);
            DrawingBoard.pad.addEventListener('mouseout', pauseDrawing, false);

            //Touch Support

            DrawingBoard.pad.addEventListener('touchstart', function(evt){
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
            DrawingBoard.pad.addEventListener('touchmove', function(evt){
                clearTimeout(remoteTouchTimeout);
                remoteTouchTimeout = null ;
                sendDrawing(evt);
            }, false);
            DrawingBoard.pad.addEventListener('touchend', function(){
                clearTimeout(remoteTouchTimeout);
                remoteTouchTimeout = null ;
                pauseDrawing();
            }, false);
            DrawingBoard.pad.addEventListener('touchcancel', function(){
                clearTimeout(remoteTouchTimeout);
                remoteTouchTimeout = null ;
                pauseDrawing();
            }, false);

            document.getElementById('clear-drawing').addEventListener('click', function () {
                clearTimeout(remoteTouchTimeout);
                remoteTouchTimeout = null ;
                socket.emit('all-clear', {
                    key: key
                });
            });

            socket.on('clear-drawing', function(){
                // DrawingBoard.clearDrawing();
                var force = true;
                var ok = force || confirm("Please confirm to delete all drawings!");
                if(ok){
                    DrawingBoard.clearDrawing();
                }
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

            // clearTimeout(animationTimeout);
            //
            // // Addding the "animation" class triggers the CSS keyframe
            // // animation that shakes the text input.
            //
            // $scope.inputAnimation = "denied animation";
            //
            // $scope.animationTimeout = setTimeout(function(){
            //     $scope.inputAnimation = '';
            // }, 1000);
            //
            // $scope.formDisplay = true;

            alert('Wrong Access Key');
            socket.disconnect();
        }

    });



    // Expose API

    this.submitKey = submitKey;
    this.socket = socket;
    this.localOnly = localOnly ;

    return this;

})();