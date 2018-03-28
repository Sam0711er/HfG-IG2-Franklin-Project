window.onload = onReady;

var video;
var imgInScreen;
var ctx;
var canvas;
var polyCanvas;
var ptx;

function onReady(){
  video = document.getElementById('video');
  canvas = document.getElementById('videoCanvas');
  polyCanvas = document.getElementById('lowPolyCanvas');

  ctx = canvas.getContext('2d');
  ptx = polyCanvas.getContext('2d');

  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream); // stream
            console.log('Camera access granted. Setup initialized.');
            draw();
        });
    }
}
function draw(){
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  //imgInScreen = ctx.getImageData(0,0,canvas.width, canvas.height);


  var imageFromStream = canvas.toDataURL();
  lowPolify(imageFromStream);


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
  var config = {'EDGE_DETECT_VALUE': 5, 'POINT_RATE': 0.075, 'POINT_MAX_NUM': 2000, 'BLUR_SIZE': 2, 'EDGE_SIZE': 8, 'PIXEL_LIMIT': 86400};

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
