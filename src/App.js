import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
// import FormText from "react-bootstrap/Form";
import "./main.css";
import { reevaluate } from "./audioLogic";
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const dynamicsCompressorNode = audioCtx.createDynamicsCompressor();

function App() {
  useEffect(() => {
    const playButton = document.getElementById("playButton");

    const handleClick = () => {
      console.log("doing reevaluate");
      reevaluate(audioCtx, dynamicsCompressorNode);
    };

    playButton.addEventListener("click", handleClick);

    return () => {
      playButton.removeEventListener("click", handleClick);
    };
  }, []); // Empty dependency array ensures that the effect runs only once on mount

  return (
    <>
      <Container style={{ marginTop: "5rem" }}>
        <h1> Lab 4: Live coding</h1>
        <p>
          Add more than one line (<b>separate lines with a semicolon</b>) to
          have two patterns repeating at once.
        </p>
      </Container>
      <Container className="text-center" style={{ marginTop: "2rem" }}>
        <Form.Control id="code" as="textarea" />
        <Button className="mt-4 playButton" size="lg" id="playButton">
          RE-COMPILE
        </Button>
      </Container>
    </>
  );
}

export default App;
