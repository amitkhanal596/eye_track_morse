import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const MorseDisplay = () => {
    const [morseCode, setMorseCode] = useState("");
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

    return (
        <div style={{ textAlign: "center", color: "white", backgroundColor: "#111", padding: "20px" }}>
            <h1>Morse Code Blink Detection</h1>
            <p>Detected Morse Code:</p>
            <p style={{ fontSize: "2em", color: "#00ff00" }}>{morseCode}</p>
            <h2>Decoded Message:</h2>
            <p style={{ fontSize: "2em", color: "#FFD700" }}>{decodedMessage}</p>
        </div>
    );
};

export default MorseDisplay;
