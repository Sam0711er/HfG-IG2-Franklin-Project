/**
 * Created by franklinhc on 9/12/15.
 */
window.onload = onReady; // first function call

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

var currentMicrophone;
var generalVolume;
var canvasHeight, canvasWidth, videoHeight, videoWidth, xRate, yRate;

var input;


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

            // handles for bezier
            var xHandle = 7      //map(brightness,0,255,0,30);
            var yHandle = map(brightness,0,255,0, Mic.getVol()*1,5);


            //ctx.fillStyle = "#cccccc";
            //ctx.strokeStyle = "#cccccc";            

                ctx.beginPath();
                ctx.moveTo(indexX*xRate , y*yRate); //start point

                ctx.bezierCurveTo(
                    indexX*xRate + xHandle, y*yRate + yHandle,          //first bezier handle
                    (indexX+1)*xRate - xHandle, (y*yRate) - yHandle,    //second bezier handle
                    (indexX+1)*xRate, y*yRate);                         //end point
                
                ctx.lineWidth = stroke;
                ctx.strokeStyle = 'rgba(255,255,255,'+ alpha +')';
                //ctx.strokeStyle = 'hsl(0,100%,50%)';            
                ctx.stroke();
            
            indexX++;
        }
    }

    // Draw the pixels onto the visible canvas
    //ctx.putImageData(imgInScreen,0,0);


    // printing text in canvas
   /*! ctx.fillStyle = "#ffffff";
    ctx.font = "normal 11px Product Sans";
    ctx.fillText(rgba + "   currente frame rate = "+(1000/frameTime).toFixed(1) + " fps" + "       type: 1-2-3-4-5", 20, canvas.height-20);

    // frameRate calculating
    frameTime+= (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
    var fpsOut = document.getElementById('frameRate');
    fpsOut.innerHTML = "current frame = " +frameCounter+ "   currente frame rate = "+(1000/frameTime).toFixed(1) + " fps";
    frameCounter += 1;*/

    console.log(generalVolume);

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
    this.mapSound = function(_me, _total, _min, _max){

      if (self.spectrum.length > 0) {

        var min = _min || 0;
        var max = _max || 100;
        //actual new freq
        var new_freq = Math.floor(_me /_total * self.data.length);
        //console.log(self.spectrum[new_freq]);
        // map the volumes to a useful number
        return map(self.data[new_freq], 0, self.peak_volume, min, max);
      } else {
        return 0;
      }

    }

    this.mapRawSound = function(_me, _total, _min, _max){

      if (self.spectrum.length > 0) {

        var min = _min || 0;
        var max = _max || 100;
        //actual new freq
        var new_freq = Math.floor(_me /_total * (self.spectrum.length)/2);
        //console.log(self.spectrum[new_freq]);
        // map the volumes to a useful number
        return map(self.spectrum[new_freq], 0, self.peak_volume, min, max);
      } else {
        return 0;
      }

    }


    this.getVol = function(){

      // map total volume to 100 for convenience
      self.volume = map(self.vol, 0, self.peak_volume, 0, 100);
      return self.volume;
    }

    this.getVolume = function() { return this.getVol();}

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


  this.getBass = function(){
          return this.getMix().bass;
    }

  this.getMids = function(){
        return this.getMix().mids;
  }

  this.getHighs = function(){
        return this.getMix().highs;
  }

  this.getHighsVol = function(_min, _max){
    var min = _min || 0;
    var max = _max || 100;
    var v = map(this.getRMS(this.getMix().highs), 0, self.peak_volume, min, max);
    return v;
  }

  this.getMidsVol = function(_min, _max){
    var min = _min || 0;
    var max = _max || 100;
    var v = map(this.getRMS(this.getMix().mids), 0, self.peak_volume, min, max);
    return v;
  }

  this.getBassVol = function(_min, _max){
    var min = _min || 0;
    var max = _max || 100;
    var v = map(this.getRMS(this.getMix().bass), 0, self.peak_volume, min, max);
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


  this.matchNote = function (freq) {
    var closest = "A#1"; // Default closest note
    var closestFreq = 58.2705;
    for (var key in notes) { // Iterates through note look-up table
        // If the current note in the table is closer to the given
        // frequency than the current "closest" note, replace the
        // "closest" note.
        if (Math.abs(notes[key] - freq) <= Math.abs(notes[closest] -
                freq)) {
            closest = key;
            closestFreq = notes[key];
        }
        // Stop searching once the current note in the table is of higher
        // frequency than the given frequency.
        if (notes[key] > freq) {
            break;
        }
    }

    return [closest, closestFreq];
}


  return this;

  };



var Mic = new Microphone();