import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const MorseApp = () => {
    const [morseCode, setMorseCode] = useState("...");
    const [decodedMessage, setDecodedMessage] = useState("");

    useEffect(() => {
        socket.on("morse_update", (data) => {
            setMorseCode(data.morse);
        });

        socket.on("decoded_message", (data) => {
            setDecodedMessage(data.message);
        });

        return () => {
            socket.off("morse_update");
            socket.off("decoded_message");
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
            <div className="webcam-container">
                <video id="webcam" autoPlay playsInline></video>
            </div>
        </div>
    );
};

export default MorseApp;
