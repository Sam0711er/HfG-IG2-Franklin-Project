window.onload = onReady;

var video;
var imgInScreen;
var ctx;
var canvas;
var polyCanvas;
var ptx;
var back, backCxt;
var currentAnimationType = "polygon";

var canvasHeight, canvasWidth, videoHeight, videoWidth, xRate, yRate;

function onReady(){
  video = document.getElementById('video');
  canvas = document.getElementById('videoCanvas');
  polyCanvas = document.getElementById('lowPolyCanvas');

  ctx = canvas.getContext('2d');
  ptx = polyCanvas.getContext('2d');

  polyCanvas.addEventListener('mousemove', pick);


  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream); // stream
            console.log('Camera access granted. Setup initialized.');
            draw();
        });
    }


    back = document.createElement('canvas');
    backCxt = back.getContext('2d');

    videoWidth = video.width;
    videoHeight = video.height;
    canvasWidth = polyCanvas.width;
    canvasHeight = polyCanvas.height;
    xRate = canvasWidth/videoWidth;
    yRate = canvasHeight/videoHeight;


}


function draw(){
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  backCxt.drawImage(video,0,0, videoWidth, videoHeight); // to use camera als background

 // imgInScreen = ctx.getImageData(0,0,canvas.width, canvas.height);

  switch (currentAnimationType){
   case "sinus":
      drawSinusToCanvas();

   break;
   case "polygon":
      var imageFromStream = canvas.toDataURL();
      lowPolify(imageFromStream);
   break;
}


  // Continuos Refresh of draw()
  requestAnimFrame(draw);
}

/*var pixels = [];
function updateImageData(imgInScreen){

  for (var i = 0; i < imgInScreen.data.length; i+=4) {
    var pixel = {r: imgInScreen.data[i], g: imgInScreen.data[i+1], b: imgInScreen.data[i+2], a: imgInScreen.data[i+3]};
    pixels[i] = pixel;
  }
  //console.log(pixels);
}*/

function lowPolify(url){
  var config = {'EDGE_DETECT_VALUE': 50, 'POINT_RATE': 0.075, 'POINT_MAX_NUM': 2000, 'BLUR_SIZE': 2, 'EDGE_SIZE': 3, 'PIXEL_LIMIT': 86400};

  var l = new LowPoly(url, config).init().then((data) => { /*console.log("data is "+data);*/ drawPolyToCanvas(data);});
}

function drawPolyToCanvas(data){
  var image = new Image();
  image.onload = function() {
  ptx.drawImage(this, 0, 0, polyCanvas.width, polyCanvas.height);
  };

  image.src = data;



  //ptx.drawImage(imageToDraw, 0, 0, polyCanvas.width, polyCanvas.height);

  //saveBase64AsFile(data, "lol")
}

function drawSinusToCanvas(){
  // for background
    ptx.fillStyle="#090909"; // dark 
    ptx.fillRect(0, 0, canvas.width, canvas.height);

    backCxt.drawImage(video,0,0, videoWidth, videoHeight); // to use camera als background
    imgInScreen = backCxt.getImageData(0,0, videoWidth, videoHeight);

    var indexX = 0;

    for (var y = 0; y < videoHeight; y++) {
      indexX = 0;
      for (var x = videoWidth; x > 0; x--) {
            var pixel = backCxt.getImageData(x, y, 1, 1);
            var data = pixel.data;
            rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';

            var brightness = (3*data[0] +4*data[1]+data[2])>>>3;

            var stroke = map(brightness, 0, 255, 0.5, 3);
            var alpha =  map(brightness,0,255,0.5,1);


            var xHandle = 7
            var yHandle = map(brightness,0,255,0, Math.random() * (10 - 0) + 0 );


            ptx.beginPath();
            ptx.moveTo(indexX*xRate , y*yRate); //start point

            ptx.bezierCurveTo(
                    indexX*xRate + xHandle, y*yRate + yHandle,          //first bezier handle
                    (indexX+1)*xRate - xHandle, (y*yRate) - yHandle,    //second bezier handle
                    (indexX+1)*xRate, y*yRate);                         //end point

                ptx.lineWidth = stroke;
                ptx.strokeStyle = 'hsl(0,100%,100%)';            
                ptx.stroke(); 

            indexX++;

      }
    }

}




function map(valor, minFuente, maxFuente, minTarget, maxTarget) {
    if (valor < minFuente) return minTarget;
    if (valor > maxFuente) return maxTarget;

    var tmp = (maxTarget-minTarget)/(maxFuente-minFuente);
    tmp = (tmp * (valor-minFuente))+minTarget;
    return tmp;
}

/*
function saveBase64AsFile(base64, fileName) {

    var link = document.createElement("a");

    link.setAttribute("href", base64);
    link.setAttribute("download", fileName);
    link.click();
}
*/
function loadAndDrawImage(){

}

function pick(event) {
    mouseX = event.layerX;
    mouseY = event.layerY;

    var pixel = ptx.getImageData(mouseX, mouseY, 1, 1);
    var data = pixel.data;
    rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';
    //console.log(rgba);
}

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
