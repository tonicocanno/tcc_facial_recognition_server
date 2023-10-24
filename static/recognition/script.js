//#region global configs

'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
    audio: false,
    video: true
};

//#endregion

//#region Init functions

async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
    } catch (e) {
        handleError(e);
    }
}

function initRealTimeVideoComponents() {
    label.style.display = 'block';
    label.innerText = 'Carregando...';
}

function initProgressBar() {
    const progressBarContainer = document.querySelector('.progress-bar-container');
    progressBarContainer.style.display = 'flex';
    progressBarContainer.style.opacity = 1;
}

function initializeCanvasVideo() {
    let [w, h] = [video.offsetWidth, video.offsetHeight];
    canvas.width = w;
    canvas.height = h;
    initializeCanvasEmotion(w, h);
}

function initializeCanvasEmotion(width, height) {
    canvasEmotion.width = width;
    canvasEmotion.height = height;
}

//#endregion

//#region general functions

function handleSuccess(stream) {
    const video = document.querySelector('video');
    const videoTracks = stream.getVideoTracks();
    console.log('Got stream with constraints:', constraints);
    console.log(`Using video device: ${videoTracks[0].label}`);
    window.stream = stream; // make variable available to browser console
    video.srcObject = stream;
}

function handleError(error) {
    if (error.name === 'OverconstrainedError') {
        const v = constraints.video;
        errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
    } else if (error.name === 'NotAllowedError') {
        errorMsg('Permissions have not been granted to use your camera and ' +
            'microphone, you need to allow the page access to your devices in ' +
            'order for the demo to work.');
    }
    errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined') {
        console.error(error);
    }
}

function getImageBase64FromVideo() {
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    let base64ImageData = canvas.toDataURL();
    return base64ImageData.split(',')[1];
}

function getImageBase64FromFile(file, callback) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const base64String = e.target.result;
        callback(base64String);
    };

    return reader.readAsDataURL(file);
}

function getEmotions(image, repeat) {
    const request = new Request("/face", {
        method: "POST",
        body: JSON.stringify({ base64: image }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    fetch(request)
        .then((response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Something went wrong on API server!");
            }
        })
        .then((response) => {
            contextEmotion.reset();

            if (response.label) {
                label.innerText = response.label + ' (' + (response.emotion_probability * 100).toFixed(2) + '% )';

                if (response.faces.length) {
                    contextEmotion.strokeStyle = "#008000";
                    contextEmotion.lineWidth = 4;
                    const faces = response.faces[0];

                    contextEmotion.beginPath();
                    contextEmotion.rect(faces[0], faces[1], faces[2], faces[3]);
                    contextEmotion.stroke();
                }

                if (response.preds.length) {
                    updateProgressBar(response.preds[0], 'Raiva', 'progress-bar-angry');
                    updateProgressBar(response.preds[1], 'Nojo', 'progress-bar-disgust');
                    updateProgressBar(response.preds[2], 'Medo', 'progress-bar-fear');
                    updateProgressBar(response.preds[3], 'Feliz', 'progress-bar-happy');
                    updateProgressBar(response.preds[4], 'Triste', 'progress-bar-sad');
                    updateProgressBar(response.preds[5], 'Surpreso', 'progress-bar-surprise');
                    updateProgressBar(response.preds[6], 'Neutro', 'progress-bar-neutral');
                }
            } else
                label.innerText = 'Sem emoção detectada.'

        })
        .catch((error) => {
            console.error(error);
            label.innerText = 'Ocorreu um erro ao detectar a emoção';
        })
        .then(() => {
            if (repeat)
                getEmotions(getImageBase64FromVideo(), repeat);
        });
}

function updateProgressBar(emotion, emotionName, progressId) {
    const percentage = (emotion * 100).toFixed(0);
    const progress = document.getElementById(progressId);
    const progressSpan = progress.querySelector('.progress-bar-fill');
    const progressPercentage = progress.querySelector('.progress-bar-percentage');
    progressSpan.style.width = `${percentage}%`;
    progressPercentage.innerText = `${emotionName} - ${percentage}%`;
}

//#endregion

//#region variables and init

function initCamera() {
    init();
    initRealTimeVideoComponents();
    initProgressBar();
}

const fileInput = document.getElementById('fileInput');

// Define um evento para ser acionado quando o arquivo é selecionado
fileInput.addEventListener('change', function() {
    const selectedFile = fileInput.files[0]; // Obtém o arquivo selecionado

    if (selectedFile) {
        getImageBase64FromFile(selectedFile, (imageBase64) => {
            const imageBase64WithoutMimetype = imageBase64.split(',')[1];
            getEmotions(imageBase64WithoutMimetype);

            image.style.display = 'block';
            image.src = imageBase64;

            image.onload = function() {
                const w = image.width;
                const h = image.height;

                initializeCanvasEmotion(w, h);
            };
        })
    }
});

const video = document.getElementById("gum-local");

video.addEventListener('loadedmetadata', () => {
    initializeCanvasVideo();
    const image = getImageBase64FromVideo();
    getEmotions(image, true);
})


const image = document.getElementById("image-emotion");
const label = document.getElementById('emotion');
initCamera();

let canvas = document.createElement("canvas");
let context = canvas.getContext("2d");

const canvasEmotion = document.getElementById("canvas-emotion");
const contextEmotion = canvasEmotion.getContext("2d");

//#endregion