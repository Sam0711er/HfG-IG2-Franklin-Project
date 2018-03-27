window.onload = onReady;

var video;
var imgInScreen;
var ctx;
var canvas;

function onReady(){
  video = document.getElementById('video');
  canvas = document.getElementById('videoCanvas');

  ctx = canvas.getContext('2d');


  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream); // stream
            console.log('Camera access granted. Setup initialized.');
            draw();
            setupPolyer();
        });
    }
}
function draw(){
  //console.log('draw() called');

  ctx.drawImage(video,0,0, canvas.width, canvas.height); // Use camera as background

  imgInScreen = ctx.getImageData(0,0,canvas.width, canvas.height);

  updateImageData(imgInScreen);



  // Continuos Refresh of draw()
  requestAnimFrame(draw);
}

var pixels = [];
function updateImageData(imgInScreen){

  for (var i = 0; i < imgInScreen.data.length; i+=4) {
    var pixel = {r: imgInScreen.data[i], g: imgInScreen.data[i+1], b: imgInScreen.data[i+2], a: imgInScreen.data[i+3]};
    pixels[i] = pixel;
  }
  //console.log(pixels);
}

var canvas_box = document.getElementById("canvas-box"),
    videoCanvas = document.createElement("videoCanvas"),
    srcs = ["./img/dog.jpg", "./img/tiger.jpg", "./img/cat.jpg"],
    WebGLs,
    points,
    poly;

function setupPolyer(){
  points = new Polyer.WebGL(videoCanvas);

//  console.log(panel);
}

// MARK: Animation requests
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
