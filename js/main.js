window.onload = onReady;

var video;

function onReady(){
  video = document.getElementById('video');

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
  console.log('draw() called');








  // Continuos Refresh of draw()
  requestAnimFrame(draw);
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
