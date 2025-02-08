from flask import Flask, render_template
from flask_socketio import SocketIO
import cv2
import dlib
import time
from scipy.spatial import distance

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor('shape_predictor_68_face_landmarks.dat')

LEFT_EYE = [36, 37, 38, 39, 40, 41]
RIGHT_EYE = [42, 43, 44, 45, 46, 47]

MORSE_CODE_DICT = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
    "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
    "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
    ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
    "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
    "--..": "Z", " ": " "
}

def calculate_ear(eye):
    A = distance.euclidean(eye[1], eye[5])
    B = distance.euclidean(eye[2], eye[4])
    C = distance.euclidean(eye[0], eye[3])
    return (A + B) / (2.0 * C)

EAR_THRESHOLD = 0.22
DOT_THRESHOLD = 0.3
LETTER_PAUSE = 2.0  
WORD_PAUSE = 5.0  

blink_start_time = None
morse_code_sequence = []
decoded_message = ""

camera = cv2.VideoCapture(0)

def detect_blinks():
    global blink_start_time, morse_code_sequence, decoded_message

    last_blink_time = time.time()

    while True:
        ret, frame = camera.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = detector(gray)

        for face in faces:
            landmarks = predictor(gray, face)

            left_eye = [(landmarks.part(n).x, landmarks.part(n).y) for n in LEFT_EYE]
            right_eye = [(landmarks.part(n).x, landmarks.part(n).y) for n in RIGHT_EYE]

            left_ear = calculate_ear(left_eye)
            right_ear = calculate_ear(right_eye)
            avg_ear = (left_ear + right_ear) / 2.0

            if avg_ear < EAR_THRESHOLD:
                if blink_start_time is None:
                    blink_start_time = time.time()
            else:
                if blink_start_time is not None:
                    blink_duration = time.time() - blink_start_time
                    blink_start_time = None  

                    if blink_duration < DOT_THRESHOLD:
                        morse_code_sequence.append(".")
                    else:
                        morse_code_sequence.append("-")

                    socketio.emit("morse_update", {"morse": "".join(morse_code_sequence)})

                    last_blink_time = time.time()

        elapsed_time = time.time() - last_blink_time

        if elapsed_time > LETTER_PAUSE and morse_code_sequence:  # Prevent empty decoding
            morse_str = "".join(morse_code_sequence)
            decoded_message += MORSE_CODE_DICT.get(morse_str, " ")  # Default to space
            morse_code_sequence = []  # Reset for next letter


        elif elapsed_time > LETTER_PAUSE:
            morse_str = "".join(morse_code_sequence)
            decoded_message += MORSE_CODE_DICT.get(morse_str, "?")
            morse_code_sequence = []  
            socketio.emit("decoded_message", {"message": decoded_message})

        socketio.sleep(0.1)

@app.route('/')
def index():
    return "Morse Code Detection Server Running"

@socketio.on("connect")
def handle_connect():
    print("Client connected")

if __name__ == '__main__':
    socketio.start_background_task(target=detect_blinks)
    socketio.run(app, host="0.0.0.0", port=5002)
