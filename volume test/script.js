window.onLoad = onReady();
var canvas;
var ctx;




function onReady() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  setupMicrophone();
}

function setupMicrophone () {

  var fftSize = 256;
  var audioContext = new AudioContext();
  var sampleRate = audioContext.sampleRate;
  
  
  //browser check
  window.AudioContext = window.AudioContext ||  window.webkitAudioContext;
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

  // now just wait until the microphone is fired up
  window.addEventListener('load', init, false);
  function init () {
      try {
        startMic(audioContext);
      }
      catch (e) {
        console.error(e);
        alert('Web Audio API is not supported in this browser');
      }
  }

  function startMic (context) {
    navigator.getUserMedia({ audio: true }, processSound, error);
    function processSound (stream) {

     // analyser extracts frequency, waveform, etc.
     var analyser = context.createAnalyser();
     analyser.smoothingTimeConstant = 0.8;
     analyser.fftSize = fftSize;
     var node = context.createScriptProcessor(fftSize*2, 1, 1);

     node.onaudioprocess = function () {
       // puts data into Uint8Array wich has half length of the fft_size
       var dataArray = new Uint8Array(analyser.frequencyBinCount);

       // getByteFrequencyData returns amplitude for each bin
       analyser.getByteFrequencyData(dataArray);
      
       // 
       var rms = 0;
        for (var i = 0; i < dataArray.length; i++) {
          rms += dataArray[i] * dataArray[i];
        }
        rms /= dataArray.length;
        rms = Math.sqrt(rms);

        soundVolume = Math.round(rms);

        ctx.fillStyle="#fff"; // dark 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle= 'rgba(' + soundVolume * 5 + ', 80 , 140 , 1)';
        ctx.fillRect(0, 0, soundVolume *5 , 50 );
        

        console.log(soundVolume);
        
        //console.log(rms);      
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
  console.log('working');
}
