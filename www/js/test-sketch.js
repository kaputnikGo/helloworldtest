/*
 * @name Oscillator Frequency
 * @description <p>Control an Oscillator and view the waveform using FFT.
 * MouseX is mapped to frequency, mouseY is mapped to amplitude.</p>
 * <p><em><span class="small"> To run this example locally, you will need the
 * <a href="http://p5js.org/reference/#/libraries/p5.sound">p5.sound library</a> and a
 * sound file.</span></em></p>
 */

 // mobile version
let osc, fft;

function setup() {
  createCanvas(720, 256);

  // mimics the autoplay policy
  getAudioContext().suspend();

  osc = new p5.TriOsc(); // set frequency and type
  osc.amp(0.5);

  fft = new p5.FFT();
  //osc.start();
}

function touchStarted() {
  // comply with webaudio autoplay
  userStartAudio();
  osc.start();
}

function draw() {
  background(255);
  text(int(getFrameRate()) + " fps", 10, 16);
  let waveform = fft.waveform(); // analyze the waveform
  beginShape();
  strokeWeight(5);
  for (let i = 0; i < waveform.length; i++) {
    let x = map(i, 0, waveform.length, 0, width);
    let y = map(waveform[i], -1, 1, height, 0);
    vertex(x, y);
  }
  endShape();

  // change oscillator frequency based on mouseX/touch
  let freq = map(mouseX, 0, width, 40, 880);
  osc.freq(freq);

  let amp = map(mouseY, 0, height, 1, 0.01);
  osc.amp(amp);
}
