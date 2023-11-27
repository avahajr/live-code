import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import { Button, Container } from "react-bootstrap";
import "./main.css";
// import { reevaluate } from "./audioLogic";
// sample input: sine: 3@350 1@500;
// sawtooth: 2@200;
// square: 4@600
function App() {
  let audioCtx;
  let dc;
  var liveCodeState = [];
  var numLines = 0;
  var activeOscs = [];
  var activeGains = [];

  // Check if the audioCtx is already created
  function initAudio() {
    // alert("intializing audio");
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    dc = audioCtx.createDynamicsCompressor();

    // Set the new audioCtx in the state
    scheduleAudio();
  }

  const handleButtonClick = () => {
    if (!audioCtx) {
      initAudio();
    }
    console.log("reevaluate");
    reevaluate();
  };

  function scheduleAudio() {
    let longestLine = 0;
    for (let i = 0; i < liveCodeState.length; i++) {
      let timeElapsedSecs = 0;
      let line = liveCodeState[i];
      if (line.length !== 0) {
        // each line should have its own oscillator
        const timings = activeGains[i];
        const osc = activeOscs[i];
        osc.type = line[0]["waveform"];
        osc.connect(timings).connect(dc).connect(audioCtx.destination);
        for (let j = 0; j < line.length; j++) {
          let noteData = line[j];
          timings.gain.setTargetAtTime(
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
          timings.gain.setTargetAtTime(
            0,
            audioCtx.currentTime + timeElapsedSecs,
            0.01
          );
          timeElapsedSecs += 0.2; //rest between notes

          if (timeElapsedSecs > longestLine) {
            longestLine = timeElapsedSecs;
          }
        }
      }
    }
    setTimeout(scheduleAudio, longestLine * 1000);
  }
  function parseCode(code) {
    // const code = document.getElementById("code").value;
    // Updates the line count and returns an array of arrays of objects.
    if (code === "") {
      numLines = 0;
      return [];
    }
    let lines = code.split(";\n");

    lines = lines.map((line) => {
      // sine: <rest of line here>
      let wave = line.split(":")[0];
      console.log(wave);
      let notes = line.split(" ");
      if (
        wave === "triangle" ||
        wave === "sine" ||
        wave === "sawtooth" ||
        wave === "square"
      ) {
        notes.shift(); // the first is the wa
      }
      console.log(notes);

      return notes.map((note) => {
        let noteData = note.split("@");
        return {
          waveform: wave,
          // eslint-disable-next-line
          length: eval(noteData[0]), // The 'eval' function allows us to write JS code in our live coding language
          // eslint-disable-next-line
          pitch: eval(noteData[1]),
        };
      });
    });
    numLines = lines.length;
    console.log("numlines", numLines);
    // alert(lines);
    return lines;
  }
  function reevaluate() {
    // first, call parsecode to get the new livecode state (LCS)
    const code = document.getElementById("code").value;
    const newData = parseCode(code);
    liveCodeState = newData;
    // now, make sure that there are the correct number of oscillators/gainNodes
    // this helps us get ready for the change in LCS
    // console.log(numLines, "lines,", activeOscs.length, "activeOscs");
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

        // console.log("currently active gain nodes:", activeGains.length);
        // console.log("currently active osc nodes:", activeOscs.length);
      }
    }
    console.log("updated livecode state:", liveCodeState);
    console.log("active oscs:", activeOscs);
  }

  return (
    <>
      <Container style={{ marginTop: "5rem" }}>
        <h1> Lab 4: Live coding</h1>
        <h5 style={{ marginBottom: "2rem" }}>Ava Hajratwala</h5>
        <hr></hr>
        <h3>Basic syntax</h3>
        <p>
          <code className="mx-auto">
            waveform: length@pitch length@pitch ...
          </code>
        </p>
        <p>and so on, as long as you want the sequence to be.</p>
        <h2 style={{ marginTop: "2rem" }}>Features</h2>
        <p>
          1. Separate lines with a semicolon to have two patterns repeating at
          once.
        </p>
        <p>
          2. Pick the line's waveform by labeling it with a <code>:</code>{" "}
          (defaults to sine wave).
        </p>
      </Container>
      <Container className="text-center" style={{ marginTop: "2rem" }}>
        <textarea
          className="form-control"
          id="code"
          placeholder={
            "i.e.,\nsine: 3@350 1@500;\nsawtooth: 2@200;\nsquare: 4@600\n\nand so on..."
          }
        />
        <Button
          className="mt-4 playButton"
          size="lg"
          onClick={handleButtonClick}
        >
          RE-COMPILE
        </Button>
      </Container>
    </>
  );
}

export default App;
