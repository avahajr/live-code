var liveCodeState = [];
var activeOscs = [];
var activeGains = [];
var numLines = 0;
// const playButton = document.getElementById("playButton");

export function initAudio() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // const dynamicsCompressorNode = audioCtx.createDynamicsCompressor();
  return audioCtx;
}

function scheduleAudio(line, osc, gainNode, audioCtx) {
  let timeElapsedSecs = 0;
  // console.log("line has type", typeof line, line);

  line.forEach((noteData) => {
    // console.log("noteData has type", typeof noteData, noteData);
    gainNode.gain.setTargetAtTime(
      1,
      audioCtx.currentTime + timeElapsedSecs,
      0.01
    );
    osc.frequency.setTargetAtTime(
      noteData["pitch"],
      audioCtx.currentTime + timeElapsedSecs,
      0.01
    );
    timeElapsedSecs += noteData["length"] / 10.0;
    gainNode.gain.setTargetAtTime(
      0,
      audioCtx.currentTime + timeElapsedSecs,
      0.01
    );
    timeElapsedSecs += 0.2; //rest between notes

    setTimeout(
      () => scheduleAudio(line, osc, gainNode, audioCtx),
      timeElapsedSecs * 1000
    );
  });
}

function parseCode(code) {
  // How could we allow for a repeat operation
  // (e.g. "3@340 2[1@220 2@330]"" plays as "3@340 1@220 2@330 1@220 2@330")
  // How could we allow for two lines that play at the same time?
  // What if we want variables?
  // How does this parsing technique limit us?
  if (code === "") {
    return null;
  }
  let lines = code.split(";\n");
  lines = lines.map((line) => {
    let notes = line.split(" ");

    // Notice this will fail if the input is not correct
    // How could you handle this? Allow some flexibility in the grammar? Fail gracefully?
    // Ideally (probably), the music does not stop
    return notes.map((note) => {
      var noteData = note.split("@");
      return {
        // eslint-disable-next-line
        length: eval(noteData[0]), // The 'eval' function allows us to write JS code in our live coding language
        // eslint-disable-next-line
        pitch: eval(noteData[1]),
      };
    });
    // What other things should be controlled? Osc type? Synthesis technique?
  });
  console.log("lines:", lines);
  return lines;
}

function genAudio(data, audioCtx) {
  liveCodeState = data;
  numLines = Object.keys(data).length;
  console.log("numLines:", numLines, ",", "# active oscs:", activeOscs.length);
  if (numLines > activeOscs.length) {
    adjustNumOscsAndGains(1, audioCtx); // add more oscilators
  } else if (numLines < activeOscs.length) {
    adjustNumOscsAndGains(0, audioCtx); // remove some oscilators
  }
}

function adjustNumOscsAndGains(increase, audioCtx) {
  if (increase) {
    // console.log("increase");
    while (numLines > activeOscs.length) {
      const newOsc = audioCtx.createOscillator();
      newOsc.start();
      activeOscs.push(newOsc);
      activeGains.push(audioCtx.createGain());
      // console.log("currently active gain nodes:", activeGains.length);
      // console.log("currently active osc nodes:", activeOscs.length);
    }
  } else {
    // console.log("decrease");
    while (numLines < activeOscs.length) {
      const removedGainNode = activeGains.pop();
      removedGainNode.setTargetAtTime(0, audioCtx.currentTime);
      const removedOsc = activeOscs.pop();
      removedOsc.stop(audioCtx.currentTime + 0.1);
      removedOsc.disconnect();
      // console.log("currently active gain nodes:", activeGains.length);
      // console.log("currently active osc nodes:", activeOscs.length);
    }
  }
  // console.log("finishing adjustNumOscsAndGains");
  // console.log("numLines:", numLines);
  // console.log("currently active gain nodes:", activeGains.length);
  // console.log("currently active osc nodes:", activeOscs.length);
}

export function reevaluate(audioCtx, dc) {
  var code = document.getElementById("code").value;
  var data = parseCode(code);

  if (data) {
    genAudio(data, audioCtx); // modifies the liveCodeState, preps gain and oscs
    console.log("currently active gain nodes:", activeGains.length);
    console.log("currently active osc nodes:", activeOscs.length);

    var idx = 0;
    liveCodeState.forEach((line) => {
      const osc = activeOscs[idx];
      const timings = activeGains[idx];

      timings.gain.value = 0;
      osc.connect(timings).connect(dc).connect(audioCtx.destination);

      scheduleAudio(line, osc, timings, audioCtx);
      idx++;
    });
  }
}
