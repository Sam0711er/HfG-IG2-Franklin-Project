window.onload = onReady;

var video, imgInScreen, ctx, canvas, polyCanvas, ptx, back, backCxt, canvasHeight, canvasWidth, videoHeight, videoWidth, xRate, yRate;
var polygonQueue = 0;

function onReady(){
  video = document.getElementById('video');
  canvas = document.getElementById('videoCanvas');
  polyCanvas = document.getElementById('lowPolyCanvas');

  ctx = canvas.getContext('2d');
  ptx = polyCanvas.getContext('2d');

  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we use Microphone() for audio
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream); // stream
            console.log('Camera access granted. Setup initialized.');
            draw();
            DiffCamEngine.stream = stream;
            DiffCamEngine.init({
              stream: stream,
              captureIntervalTime: 50,
              captureWidth: 40,
              captureHeight: 30,
              pixelDiffThreshold: 32,
              scoreThreshold: 32,
              captureCallback: updateQueue
            });
            DiffCamEngine.start();
        });
    }

    // Back canvas, supporting camera data generation
    back = document.createElement('canvas');
    backCxt = back.getContext('2d');

    videoWidth = video.width;
    videoHeight = video.height;
    canvasWidth = polyCanvas.width;
    canvasHeight = polyCanvas.height;
    xRate = canvasWidth/videoWidth*9;
    yRate = canvasHeight/videoHeight;

    playAudio();
}

function draw(){
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  backCxt.drawImage(video,0,0, videoWidth, videoHeight); // For camera background use

  // Get image data of main camera context
  var imageData = ctx.getImageData(canvas.width/3, 0, canvas.width/3, canvas.height);

  // Supporting canvas for cropping
  var croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = canvas.width/3;
  croppedCanvas.height = canvas.height;

  // Supporting canvas
  var croppedctx1 = croppedCanvas.getContext("2d");
  croppedctx1.putImageData(imageData, 0, 0);

  if (polygonQueue > 0){
    // Executed when polygonQueue is bigger than 0, meaning polygons are active.

    // Saturation value setter
    var saturationValue = 50 * polygonQueue;
    if (saturationValue > 100){
      saturationValue = 100;
    }

    // Hue value setter
    var hueValue = 170 + polygonQueue*15;
    if (hueValue > 360){
        hueValue = 360;
    }

    // Brightness value setter
    var brightnessValue = 50;

    // Stream image cropper
    var croppedImageFromStream = croppedCanvas.toDataURL("image/png");
    lowPolify(croppedImageFromStream, 'hsl(' + hueValue + ',' + saturationValue + '%,' + brightnessValue + '%)');
  }else{
    // Executed when polygonQueue is 0, meaning sinus is active.

    ptx.fillStyle="#090909";
    ptx.fillRect(0, 0, canvas.width, canvas.height);

    drawSinusToCanvas();
  }

  // Continuos Refresh of draw()
  requestAnimFrame(draw);
}

// Polification, access LowPolifier library
function lowPolify(url,queueValue){
  var config = {'EDGE_DETECT_VALUE': 50, 'POINT_RATE': 0.075, 'POINT_MAX_NUM': 1500, 'BLUR_SIZE': 4, 'EDGE_SIZE': 3, 'PIXEL_LIMIT': 1000, 'COLOR_VALUE': queueValue};

  var l = new LowPoly(url, config).init().then((data) => {drawPolyToCanvas(data);});
}

// Add lowPolify to canvas
function drawPolyToCanvas(data){
  var image = new Image();
  image.onload = function() {
    ptx.drawImage(this, 0, 0, polyCanvas.width, polyCanvas.height);
  };

  image.src = data;
}

// Add sinus to canvas
function drawSinusToCanvas(){
  backCxt.drawImage(video,0,0, videoWidth, videoHeight);
  imgInScreen = backCxt.getImageData(0,0, videoWidth, videoHeight);

  var indexX = 0;
  var midVolume = Mic.getMidsVol();
  var midsColorVolume = map(midVolume,0,100,0,30) + 170;

  // -- Grid & Bezier creation
  // Vertical looping
  for (var y = 0; y < videoHeight; y+=2) {
    indexX = 0;

    // Horizontal looping
    for (var x = videoWidth/3; x < videoWidth*2/3; x+=3) {
      var pixel = backCxt.getImageData(x, y, 1, 1);
      var data = pixel.data;
      rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';

      var brightness = (3*data[0] +4*data[1]+data[2])>>>3;

      var stroke = map(brightness, 0, 255, 0.2, 1.5);
      var alpha =  map(brightness,0,255,0.5,1);

      var xHandle = 7;
      var yHandle = map(brightness,0,255,0, midVolume);

      // Sinus Bezier Path drawing
      ptx.beginPath();
      ptx.moveTo(indexX*xRate , y*yRate); //start point
      ptx.bezierCurveTo(
        indexX*xRate + xHandle, y*yRate + yHandle,          //first bezier handle
        (indexX+1)*xRate - xHandle, (y*yRate) - yHandle,    //second bezier handle
        (indexX+1)*xRate, y*yRate);                         //end point
      ptx.lineWidth = stroke;
      ptx.strokeStyle = 'hsl( '+ midsColorVolume +',80%,50%)';
      ptx.stroke();

      indexX++;
    }
  }
}

// Check if motion score threshold is passed, update polygonQueue
function updateQueue(data){
  if (data.score > 150){
    polygonQueue += 1;
    setTimeout(
      function(){
        polygonQueue -= 1;
        console.log("Timeout");
      },2000);
  }
}

// Mapping Tool
function map(value, minSource, maxSource, minTarget, maxTarget) {
    if (value < minSource) return minTarget;
    if (value > maxSource) return maxTarget;

    var tmp = (maxTarget-minTarget)/(maxSource-minSource);
    tmp = (tmp * (value-minSource))+minTarget;
    return tmp;
}


/*
// Debugging: Export lowPolify output
function saveBase64AsFile(base64, fileName) {

    var link = document.createElement("a");

    link.setAttribute("href", base64);
    link.setAttribute("download", fileName);
    link.click();
}
*/

// Audio output
function playAudio(){
  var audio = new Audio('audio/Pacific_Hike.mp3');
  audio.loop = true
  audio.play();
}


// Continuos Refresh
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

// Microphone setup
function Microphone (_fft) {
    var FFT_SIZE = _fft || 2048;

    this.spectrum = new Uint8Array(FFT_SIZE/2);
    this.data = [];
    this.volume = this.vol = 0;
    this.peak_volume = 0;

    var self = this;
    var audioContext = new AudioContext();

    var SAMPLE_RATE = audioContext.sampleRate;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

    window.addEventListener('load', init, false);

    function init () {
      try {
        startMic(new AudioContext());
      }
      catch (e) {
        console.error(e);
        alert('Web Audio API is not supported in this browser');
      }
    }

    function startMic (context) {
      navigator.getUserMedia({ audio: true }, processSound, error);
      function processSound (stream) {

        // analyser extracts frequency, waveform, and other data
        var analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.2;
        analyser.fftSize = FFT_SIZE;

        var node = context.createScriptProcessor(FFT_SIZE*2, 1, 1);

        node.onaudioprocess = function () {

          // getByteFrequencyData returns the amplitude for each frequency
          analyser.getByteFrequencyData(self.spectrum);
          self.data = adjustFreqData(self.spectrum);

          // getByteTimeDomainData gets volumes over the sample time
          //analyser.getByteTimeDomainData(dataArray);
          self.vol = self.getRMS(self.spectrum);
          // get peak
          if (self.vol > self.peak_volume) self.peak_volume = self.vol;
          self.volume = self.vol;
        };

        var input = context.createMediaStreamSource(stream);

        input.connect(analyser);
        analyser.connect(node);
        node.connect(context.destination);

      }

      function error () {
        console.log(arguments);
      }

    }

    ///////////////////////////////////////////////
    ////////////// SOUND UTILITIES  //////////////
    /////////////////////////////////////////////

    //A more accurate way to get overall volume
    this.getRMS = function (spectrum) {

          var rms = 0;
          for (var i = 0; i < spectrum.length; i++) {
            rms += spectrum[i] * spectrum[i];
          }
          rms /= spectrum.length;
          rms = Math.sqrt(rms);
          return rms;
    }

//freq = n * SAMPLE_RATE / MY_FFT_SIZE
function mapFreq(i){
  var freq = i * SAMPLE_RATE / FFT_SIZE;
  return freq;
}

// getMix function. Computes the current frequency with
// computeFreqFromFFT, then returns bass, mids and his
// sub bass : 0 > 100hz
// mid bass : 80 > 500hz
// mid range: 400 > 2000hz
// upper mid: 1000 > 6000hz
// high freq: 4000 > 12000hz
// Very high freq: 10000 > 20000hz and above

  this.getMix = function(){
    var highs = [];
    var mids = [];
    var bass = [];
    for (var i = 0; i < self.spectrum.length; i++) {
      var band = mapFreq(i);
      var v = map(self.spectrum[i], 0, self.peak_volume, 0, 100);
      if (band < 500) {
        bass.push(v);
      }
      if (band > 400 && band < 6000) {
          mids.push(v);
      }
      if (band > 4000) {
          highs.push(v);
      }
    }
    //console.log(bass);
    return {bass: bass, mids: mids, highs: highs}
  }

  this.getMidsVol = function(_min, _max){
    var min = _min || 0;
    var max = _max || 100;
    var v = map(this.getRMS(this.getMix().mids), 0, self.peak_volume, min, max);
    return v;
  }

  function adjustFreqData(frequencyData, ammt) {
    // get frequency data, remove obsolete
  //analyserNode.getByteFrequencyData(frequencyData);

  frequencyData.slice(0,frequencyData.length/2);
  var new_length = ammt || 16;
  var newFreqs = [], prevRangeStart = 0, prevItemCount = 0;
  // looping for my new 16 items
  for (let j=1; j<=new_length; j++) {
      // define sample size
    var pow, itemCount, rangeStart;
    if (j%2 === 1) {
      pow = (j-1)/2;
    } else {
      pow = j/2;
    }
    itemCount = Math.pow(2, pow);
    if (prevItemCount === 1) {
      rangeStart = 0;
    } else {
      rangeStart = prevRangeStart + (prevItemCount/2);
    }

        // get average value, add to new array
    var newValue = 0, total = 0;
    for (let k=rangeStart; k<rangeStart+itemCount; k++) {
      // add up items and divide by total
      total += frequencyData[k];
      newValue = total/itemCount;
    }
    newFreqs.push(newValue);
    // update
    prevItemCount = itemCount;
    prevRangeStart = rangeStart;
  }
  return newFreqs;
}

  return this;
};

var Mic = new Microphone();
