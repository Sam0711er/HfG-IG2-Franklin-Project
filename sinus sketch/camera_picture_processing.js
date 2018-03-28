/**
 * Created by franklinhc on 9/12/15.
 */
window.onload = onReady; // first function call

// mouse position any time
var mouseX, mouseY;

var frameCounter;
var canvas;
var ctx;
// for frame rate
var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;

// for video/camera
var video;
var imgInScreen;
var rgba;
var back, backCxt;

var canvasHeight, canvasWidth, videoHeight, videoWidth, xRate, yRate;
var typeOfProcess = 10;



function onReady() {
    // your inicialization code here  ----------------------------------------------
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    frameCounter = 0;
    canvas.addEventListener('mousemove', pick);

    // Grab elements, create settings, etc.
    video = document.getElementById('video');

    back = document.createElement('canvas');
    backCxt = back.getContext('2d');

    // Get access to the camera!
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream); // stream
        });

        navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream); // stream
        });
    }

    videoWidth = video.width;
    videoHeight = video.height;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    xRate = canvasWidth/videoWidth*3;
    yRate = canvasHeight/videoHeight;

    draw();
    console.log("ready to gooo!");
} // end onReady()





// your drawing code here ---------------------------------------------------
function draw () {
    var thisFrameTime = (thisLoop=new Date) - lastLoop;
    // for background
    ctx.fillStyle="#090909"; // dark
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grab the pixel data from the backing canvas
    backCxt.drawImage(video,0,0, videoWidth, videoHeight); // to use camera als background
    imgInScreen = backCxt.getImageData(0,0, videoWidth, videoHeight);

    var indexX = 0;


    for (var y = 0; y < videoHeight; y++) {
        indexX = 0;
        for (var x = videoWidth*0.66; x > videoWidth*0.33; x--) {
            var pixel = backCxt.getImageData(x, y, 1, 1);
            var data = pixel.data;
            rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';
            var brightness = (3*data[0] +4*data[1]+data[2])>>>3;

            var stroke = map(brightness, 0, 255, 0.5, 3);
            var alpha =  map(brightness,0,255,0.5,1);

            var audioMultiplicator = 1;

            // handles for bezier
            var xHandle = 7      //map(brightness,0,255,0,30);
            var yHandle = map(brightness,0,255,0,10*audioMultiplicator);



            //ctx.fillStyle = "#cccccc";
            //ctx.strokeStyle = "#cccccc";

            if (x>0){
                ctx.beginPath();
                ctx.moveTo(indexX*xRate , y*yRate); //start point

                ctx.bezierCurveTo(
                    indexX*xRate + xHandle, y*yRate + yHandle,          //first bezier handle
                    (indexX+1)*xRate - xHandle, (y*yRate) - yHandle,    //second bezier handle
                    (indexX+1)*xRate, y*yRate);                         //end point

                ctx.lineWidth = stroke;
                ctx.strokeStyle = 'rgba(190,234,255,'+ alpha +')';
                ctx.stroke();
            }
            indexX++;
        }
    }

    // Draw the pixels onto the visible canvas
    //ctx.putImageData(imgInScreen,0,0);


    // printing text in canvas
    ctx.fillStyle = "#ffffff";
    ctx.font = "normal 11px Product Sans";
    ctx.fillText(rgba + "   currente frame rate = "+(1000/frameTime).toFixed(1) + " fps" + "       type: 1-2-3-4-5", 20, canvas.height-20);

    // frameRate calculating
    frameTime+= (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
    var fpsOut = document.getElementById('frameRate');
    fpsOut.innerHTML = "current frame = " +frameCounter+ "   currente frame rate = "+(1000/frameTime).toFixed(1) + " fps";
    frameCounter += 1;
    requestAnimFrame(draw);
}


function map(valor, minFuente, maxFuente, minTarget, maxTarget) {
    if (valor < minFuente) return minTarget;
    if (valor > maxFuente) return maxTarget;

    var tmp = (maxTarget-minTarget)/(maxFuente-minFuente);
    tmp = (tmp * (valor-minFuente))+minTarget;
    return tmp;
}


// for events  ---------------------------------------------------
function pick(event) {
    mouseX = event.layerX;
    mouseY = event.layerY;

    var pixel = ctx.getImageData(mouseX, mouseY, 1, 1);
    var data = pixel.data;
    rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';
    //console.log(rgba);
}


// for animation request  ---------------------------------------------------
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
        };
})();
