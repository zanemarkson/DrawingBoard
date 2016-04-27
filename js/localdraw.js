/**
 * Created by zhengma on 4/26/16.
 */

var DrawingBoard = ( function(){

    var config = function (padElement, option) {
        padElement.height = 800 || option.height ;
        padElement.width = 1600 || option.width ;
        padElement.offsetX = 8 || option.offsetX ;
        padElement.offsetY = 8 || option.offsetY ;
        var ctx = padElement.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.lineWidth = 5 || option.lineWidth;
        ctx.lineJoin = 'round' || option.lineJoin;
        ctx.lineCap = 'round' || option.lineCap ;

        return ctx ;

    };

    var pad = document.getElementById('drawingPad');
    var ctx = config(pad);

    var isDrawing = false ;
    var isClearing = false ;
    // var eraserDiameter = 16 ;
    // var ignorDrawing = true ;
    var position = {};

    var getLineSpec = function () {

        var userColor = document.getElementById('user-color-choice').value;
        var userLineWidth = document.getElementById('user-linewidth-choice').value;
        if (userColor) {
            ctx.strokeStyle = userColor ;
            // console.log(userColor);
        }
        if (userLineWidth) {
            ctx.lineWidth = userLineWidth ;
            // console.log(userLineWidth);
        }

    };

    var pos = function (x, y) {
        position.x = x ;
        position.y = y ;
    };
    var draw = function (thisContext, fromX, fromY, toX, toY) {
        //if (!isDrawing) return;

        thisContext.beginPath();
        thisContext.moveTo(fromX, fromY);
        thisContext.lineTo(toX, toY);
        thisContext.stroke();
    };
    var erase = function (thisContext,x,y){

        //if( !isClearing ) return ;

        var eraserDiameter = 20 ;
        thisContext.save();
        thisContext.beginPath();
        thisContext.arc(x, y, eraserDiameter, 0, 2 * Math.PI, false);
        thisContext.clip();
        thisContext.clearRect(x - eraserDiameter - 1, y - eraserDiameter - 1, eraserDiameter * 2 + 2, eraserDiameter * 2 + 2);
        thisContext.restore();
    };

    var pauseDrawing = function () {
        isDrawing = false ;
        isClearing = false ;
        //points.length = 0;
    };

    var clearDrawing = function () {
        isDrawing = false;
        isClearing = false ;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Here we used global variable ctx
    };

    // Mouse Motion
    pad.onmousedown = function(evt){

        console.log('MouseDown');

        pos(evt.clientX, evt.clientY);

        if( evt.button == 0 ){
            isDrawing = true ;
            isClearing = false ;
            pad.style.cursor = "default" ;
        }
        else if( evt.button == 2 ){
            isDrawing = false ;
            isClearing = true ;
            //pad.style.cursor = 'url("assets/img/eraser.png") ' + eraserDiameter + ' ' + eraserDiameter + ', auto';
            //pad.style.cursor = 'url("assets/img/sponge.png") ';
            pad.style.cursor = "crosshair" ;
            erase(ctx, position.x, position.y ) ;
        }
    };
    pad.onmousemove = function (evt) {
        if ( isDrawing == true && isClearing == false ){
            draw(ctx, position.x, position.y, evt.clientX, evt.clientY);
            pos(evt.clientX, evt.clientY);
            pad.style.cursor = "default" ;
        }
        else if ( isDrawing == false && isClearing == true ){
            pos(evt.clientX, evt.clientY);
            //pad.style.cursor = 'url("assets/img/eraser.png") ' + eraserDiameter + ' ' + eraserDiameter + ', auto';
            //pad.style.cursor = 'url("assets/img/sponge.png") ';
            pad.style.cursor = "crosshair" ;
            erase(ctx, position.x, position.y ) ;
        }
        else{
            pos( evt.clientX, evt.clientY);
        }
    };
    pad.onmouseup = function(){
        pauseDrawing();
        pad.style.cursor = "default" ;
    };
    pad.onmouseout = function(){
        pauseDrawing();
        pad.style.cursor = "default" ;
    } ;
    pad.oncontextmenu = function() { return false; };

    // Touch Support
    var touchTimeout = null ;
    pad.addEventListener('touchstart',function(evt){
        isDrawing = true;
        isClearing = false;
        evt.button = 0 ;
        touchTimeout = setTimeout( function (evt) {
            isClearing = true ;
            isDrawing = false ;
            evt.button = 2;
            pos(evt.touches[0].pageX, evt.touches[0].pageY ) ;
            erase(ctx, position.x, position.y ) ;
        }, 500 ) ;
        pos(evt.touches[0].pageX, evt.touches[0].pageY ) ;

    },false);

    pad.addEventListener('touchmove', function(evt){
        if ( isDrawing == true && isClearing == false ){
            draw(ctx, position.x, position.y, evt.clientX, evt.clientY);
            pos(evt.touches[0].pageX, evt.touches[0].pageY ) ;
        }
        else if ( isDrawing == false && isClearing == true ){
            pos(evt.touches[0].pageX, evt.touches[0].pageY ) ;
            erase(ctx, position.x, position.y ) ;
        }
        else{
            pos(evt.touches[0].pageX, evt.touches[0].pageY ) ;
        }
    }, false);
    pad.addEventListener('touchend', pauseDrawing, false);
    pad.addEventListener('touchcancel', pauseDrawing, false);


    // The UI

    document.getElementById("user-color-choice").addEventListener("change", getLineSpec());
    document.getElementById("user-linewidth-choice").addEventListener("change", getLineSpec());
    //document.getElementById("clear-drawing").addEventListener("click", clearDrawing());



    // Angular Part ...

    // var drawingBoardController = function(){
    //
    // };














    // Exposed API

    this.draw = draw;
    this.erase = erase;
    this.pauseDrawing = pauseDrawing;
    this.position = position ;
    this.config = config;
    this.clearDrawing = clearDrawing;
    this.getLineSpec = getLineSpec;
    this.pad = pad ;
    this.context = ctx ;

    return this ;




})();
