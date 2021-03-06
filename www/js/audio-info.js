/**
 * @name P5 Sound Info
 * @description <p>Display useful device derived info for sound.</p>
 * <p><em><span class="small"> To run this example locally, you will need the
 * <a href="http://p5js.org/reference/#/libraries/p5.sound">p5.sound library</a>
 * </span></em></p>
 */

// main sound object vars
let audioCtx, audioIn, audioOut, mediaInfo;
// reporting primitive vars
let inReport, devReport, ctxReport, userSource, autoSource;
// some global vars
let samRate, mainVol, micLevel, afterMicLvl;
// audio device reporting vars
let deviceID, deviceLabel, deviceGroup, deviceKind;
// pinephone has 3 sources, get info on them
let pineAudio0, pineAudio1, pineAudio2, isPine;
// audio output switching, get speakers and headphone
let destOut, outLatency, baseLatency;
// output node
let destChannel, soundNode, soundGain, soundInNode, soundOutNode;
// output osc vars
let osc, playing, freq, amp;

function setup() {
  let canvas = createCanvas(700, 800);
  canvas.mousePressed(playOscillator);
  // should return the AudioContext Object
  audioCtx = getAudioContext();
  // test it by checking state
  ctxReport = audioCtx.state;

  isPine = false; // default, for www debug, non-pine, errors etc
  audioIn = new p5.AudioIn();
  if (audioIn) inReport = "HAS IN";
  else inReport = "NO IN";

  // check the input source(s)
  audioIn.getSources(listSources);
  // try get some details about it
  audioIn.getSources(infoSource);
  // after the above has run, enum the device(3)
  // hardcode for pinephone?
  audioIn.getSources(enumSources);

  samRate = sampleRate();
  mainVol = getMasterVolume(); // 0.0 - 1.0
  if (mainVol >= 0.1) {
    mainVol *= 100;
  }
  //  AudioIn must .start() before using .getLevel()
  audioIn.start();
  micLevel = audioIn.getLevel(); // 0.0 to 1.0
  if (micLevel >= 0.1) {
    micLevel *= 100;
  }
  // set the updater var
  afterMicLvl = -1;

  // audio output thingies
  getOutLatency(); // try this at setup
  getBaseLatency();
  destOut = audioCtx.destination; // is an interface objects
  // numberOfInputs 1, numberOfOutputs 1, channelCount 2,
  // channelCountMode "explicit",
  // channelInterpretation "speakers",
  // tail-time No
  destChannel = destOut.channelInterpretation;

  // do what with this...
  audioOut = p5.soundOut;
  soundNode = audioOut._silentNode;
  soundGain = audioOut._silentNode.gain.value; // object gain node
  soundInNode = audioOut.input.gain.value; // object gain node
  if (soundInNode >= 0.1) {
    soundInNode *= 100;
  }
  soundOutNode = audioOut.output.gain.value; // object gain node - master vol?
  if (soundOutNode >= 0.1) {
    soundOutNode *= 100;
  }

  // output osc
  // set up an osc for output check
  osc = new p5.Oscillator('sine');
  freq = 440; // pitch start
  amp = 1.0; // full vol
}

/*********************************************************/

// deviceList is part of the audioIn object...
function listSources(deviceList) {
  let numDevices = deviceList.length;
  if (numDevices == 0) {
    // none enabled?
    devReport = "0";
  }
  else if (numDevices == 1) {
    // assuming will only ever be one input
    devReport = "1";
  }
  else {
    // line-in and mic-in, etc, therefore diff qualities
    devReport = (int(numDevices));
  }
}

function infoSource(sourceList) {
  autoSource = audioIn.currentSource;
  // set it to this one, or enum for all?
  audioIn.setSource(0);
  userSource = audioIn.currentSource;
  // gets an object of MediaDeviceInfo
  mediaInfo = sourceList[audioIn.currentSource];
  //
  deviceID = mediaInfo.deviceId; // UUID
  deviceLabel = mediaInfo.label; // device name, or empty
  if (deviceLabel == "") {
    deviceLabel = "empty";
  }
  deviceGroup = mediaInfo.groupId; // UUID
  // can be audioinput, audiooutput, videoinput
  deviceKind = mediaInfo.kind; // object with string return
}

function enumSources(pinePhoneList) {
  // assuming 3 sources in pinephone
  if (pinePhoneList.length == 3) {
    // get their MediaDeviceInfo objects
    pineAudio0 = pinePhoneList[0];
    pineAudio1 = pinePhoneList[1];
    pineAudio2 = pinePhoneList[2];
    isPine = true;
  }
  else {
    // error, www, or not a pinephone
    isPine = false;
  }
}

function getOutLatency() {
  // device getting NaN on outputLatency
  outLatency = audioCtx.outputLatency; // estimation in seconds
  if (isNaN(outLatency)) {
    outLatency = -1;
  }
  else if (outLatency >= 0.001) {
    outLatency *= 1000;
  }
  else {
    outLatency = 0;
  }
}

function getBaseLatency() {
  // only read when actual audio running
  // reports in secs: 0.12345678
  baseLatency = audioCtx.baseLatency;
  if (isNaN(baseLatency)) {
    baseLatency = -1;
  }
  else if (baseLatency >= 0.001) {
    baseLatency *= 1000;
  }
  else {
    //
    baseLatency = 0;
  }
}

/***************************************************************/
function playOscillator() {
  // starting an oscillator on a user gesture will enable audio
  // in browsers that have a strict autoplay policy.
  // See also: userStartAudio();
  osc.start();
  playing = true;
}

/***************************************************************/

// touchStarted(), mousePressed()
function touchStarted() {
  if (audioCtx.state !== "running") {
    audioCtx.resume();
  }
  afterMicLvl = audioIn.getLevel(); // 0.0 - 1.0
  if (afterMicLvl >= 0.01) {
    afterMicLvl *= 100;
  }
  else {
    afterMicLvl = -1;
  }

  playOscillator();
  getBaseLatency();
  return false;
}
// touchMoved(), mouseDragged()
function touchMoved() {
  // do nothing in here:
  // causes long-touch and OS popups
}
// touchEnded(), mouseReleased()
function touchEnded() {
  // could be useful
  // ramp amplitude to 0 over 0.5 seconds
  osc.amp(0, 0.5);
  playing = false;
}

/***************************************************************/

function draw() {
  background(200);
  text(int(getFrameRate()) + " fps", 10, 16);
  // osc for output
  freq = round(constrain(map(mouseX, 0, width, 100, 500), 100, 500), 3);
  if (playing) {
    // smooth the transitions by 0.1 seconds
    osc.freq(freq, 0.1);
    osc.amp(amp, 0.1);
  }
  // input vars here
  text("inReport: " + inReport, 10, 48);
  text("devReport: " + devReport, 10, 64);
  text("ctxReport: " + ctxReport, 10, 80);
  text("autoSource: " + autoSource, 10, 96);
  text("userSource: " + userSource, 10,112);
  //
  text("mediaInfo: " + mediaInfo, 10, 128); // is Object
  text("deviceID: " + deviceID, 10, 144);
  text("deviceLabel: " + deviceLabel, 10, 160);
  text("deviceGroup: " + deviceGroup, 10, 176);
  text("deviceKind: " + deviceKind, 10, 192);
  //
  text("micLevel: " + round(micLevel, 3), 10, 208);
  text("after micLvl: " + round(afterMicLvl,3), 10, 224);
  // output vars here
  text("sampleRate: " + samRate, 10 , 240);
  text("main vol: " + mainVol, 10, 256);
  text("freq: " + round(freq,3), 10, 272);
  // mediaDeviceInfo for the 3 sources
  if (isPine) {
    text("audioDevice0 kind: " + pineAudio0.kind, 10, 300);
    text("audioDevice0 ID: " + pineAudio0.deviceId, 10, 316);
    text("audioDevice1 kind: " + pineAudio1.kind, 10, 332);
    text("audioDevice1 ID: " + pineAudio1.deviceId, 10, 348);
    text("audioDevice2 kind: " + pineAudio2.kind, 10, 364);
    text("audioDevice2 ID: " + pineAudio2.deviceId, 10, 380);
  }
  else {
    text("[Error in audioDevice[3] enum...", 10, 300);
    text("... or www, or not a pinephone]", 10, 380);
  }

  // output audio various
  text("outLatency (ms): " + round(outLatency,3), 10, 400); // device can has NaN
  text("dest channel: " + destChannel, 10, 416);
  text("baseLatency (ms): " + round(baseLatency, 3), 10, 432); // device can has NaN
  text("destOut: " + destOut, 10, 448); // is Object
  text("audioOut: " + audioOut, 10, 464); // is Object
  text("audioOut._silent.node: " + soundNode, 10, 480);
  text("audioOut._silent.node.gain: " + soundGain, 10, 496);
  text("audioOut.input.gain: " + soundInNode, 10, 514);
  text("audioOut.output.gain: " + soundOutNode, 10, 530);
}
