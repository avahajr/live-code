var liveCodeState = [];
var activeOscs = [];
var activeGains = [];
var numLines = 0; // max is 10

function scheduleAudio(line, osc, gainNode, audioCtx) {
  let timeElapsedSecs = 0;
  // console.log("line has type", typeof line, line);
  if (!osc) {
    return;
  }
  if (liveCodeState.includes(line)) {
    // console.log("livecode state", liveCodeState, "includes", line);
    line.forEach((noteData) => {
      // console.log(
      //   "Processing note with length",
      //   noteData["length"],
      //   "and pitch",
      //   noteData["pitch"]
      // );

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

      setTimeout(() => scheduleAudio(), timeElapsedSecs * 1000);
    });
  } else {
    alert("ending recursive call");
  }
}

function parseCode(code) {
  // How could we allow for a repeat operation
  // (e.g. "3@340 2[1@220 2@330]"" plays as "3@340 1@220 2@330 1@220 2@330")
  // How could we allow for two lines that play at the same time?
  // What if we want variables?
  // How does this parsing technique limit us?

  if (code === "") {
    return [];
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
  numLines = data.length;
  console.log("numLines:", numLines, ",", "# active oscs:", activeOscs.length);
  if (numLines > activeOscs.length) {
    while (numLines > activeOscs.length) {
      const newOsc = audioCtx.createOscillator();
      newOsc.start();
      activeOscs.push(newOsc);
      activeGains.push(audioCtx.createGain());
      // console.log("currently active gain nodes:", activeGains.length);
      // console.log("currently active osc nodes:", activeOscs.length);
    }
  } else if (numLines < activeOscs.length) {
    while (numLines < activeOscs.length) {
      activeGains.pop().gain.setValueAtTime(0, audioCtx.currentTime);
      const removedOsc = activeOscs.pop();
      removedOsc.stop();
      removedOsc.disconnect();

      // console.log("currently active gain nodes:", activeGains.length);
      // console.log("currently active osc nodes:", activeOscs.length);
    }
  }
}

export function reevaluate(audioCtx, dc, code) {
  // var code = document.getElementById("code").value;
  var data = parseCode(code);

  genAudio(data, audioCtx); // modifies the liveCodeState, preps gain and oscs
  console.log("currently active gain nodes:", activeGains.length);
  console.log("currently active osc nodes:", activeOscs.length);

  var idx = 0;
  liveCodeState.forEach((line) => {
    const osc = activeOscs[idx];
    const timings = activeGains[idx];

    timings.gain.value = 0;
    osc.connect(timings).connect(dc).connect(audioCtx.destination);
    console.log("starting recursive call for line:", idx);
    scheduleAudio(line, osc, timings, audioCtx);
    idx++;
  });
}
