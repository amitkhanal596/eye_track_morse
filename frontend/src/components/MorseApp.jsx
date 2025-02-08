import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const MorseApp = () => {
    const [morseCode, setMorseCode] = useState("");
    const [decodedMessage, setDecodedMessage] = useState("");
    const [timing, setTiming] = useState({
        letter_pause: 0,
        word_pause: 0,
        blink_cooldown: 0
    });

    useEffect(() => {
        socket.on("morse_update", (data) => {
            setMorseCode(data.morse);
        });

        socket.on("decoded_message", (data) => {
            setDecodedMessage(data.message);
        });

        socket.on("timing_parameters", (data) => {
            setTiming(data);
        });

        return () => {
            socket.off("morse_update");
            socket.off("decoded_message");
            socket.onAnyOutgoing("timing_parameters");
        };
    }, []);

    useEffect(() => {
        async function initWebcam() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                document.getElementById("webcam").srcObject = stream;
            } catch (err) {
                console.error("Error accessing webcam: ", err);
                alert("Webcam access denied or unavailable. Please allow webcam permissions.");
            }
        }
        initWebcam();
    }, []);

    return (
        <div>
            <div className="header">Morse Code Blink Detection</div>
            <div className="morse-container">
                <p>Detected Morse Code:</p>
                <p className="morse-output">{morseCode}</p>
                <h2>Decoded Message:</h2>
                <p style={{ fontSize: "2em", color: "#FFD700" }}>{decodedMessage}</p>
            </div>
            <div className="timing-container">
                <h3>Timing Parameters</h3>
                <p>Letter Pause: {timing.letter_pause} seconds</p>
                <p>Word Pause: {timing.word_pause} seconds</p>
                <p>Blink Cooldown: {timing.blink_cooldown} seconds</p>
            </div>
            <div className="webcam-container">
                <video id="webcam" autoPlay playsInline></video>
            </div>
        </div>
    );
};

export default MorseApp;
