'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
    audio: false,
    video: true
};

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

async function init(e) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
        e.target.disabled = true;
    } catch (e) {
        handleError(e);
    }
}

function getImageBase64() {
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    let base64ImageData = canvas.toDataURL();
    return base64ImageData.split(',')[1];
}

function getEmotions() {
    const image = getImageBase64();

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
            console.debug(response);
            contextEmotion.reset();

            if (response.label) {
                label.innerText = response.label + ' (' + (response.emotion_probability * 100).toFixed(2) + '% )';

                if (response.faces.length) {
                    contextEmotion.strokeStyle = "#008000";
                    const faces = response.faces[0];

                    contextEmotion.beginPath();
                    contextEmotion.rect(faces[0], faces[1], faces[2], faces[3]);
                    contextEmotion.stroke();
                }

                if (response.preds.length) {
                    setEmotionsProgressbar(response.preds);
                }
            } else
                label.innerText = 'Sem emoção detectada.'

        })
        .catch((error) => {
            console.error(error);
            label.innerText = 'Ocorreu um erro ao detectar a emoção';
        })
        .then(() => {
            getEmotions();
        });
}

function setEmotionsProgressbar(emotions) {
    const angryPercentage = ((emotions[0] * 100).toFixed(0));
    const angryProgress = document.getElementById('progress-bar-angry');
    angryProgress.style.width = `${ (emotions[0] * 100 ).toFixed(0)}%`;
    angryProgress.innerText = `Raiva - ${ angryPercentage }%`;

    const disgustPercentage = ((emotions[1] * 100).toFixed(0));
    const disgustProgress = document.getElementById('progress-bar-disgust');
    disgustProgress.style.width = `${ (emotions[1] * 100 ).toFixed(0)}%`;
    disgustProgress.innerText = `Nojo - ${ disgustPercentage }%`;

    const fearPercentage = ((emotions[2] * 100).toFixed(0));
    const fearProgress = document.getElementById('progress-bar-fear');
    fearProgress.style.width = `${ (emotions[2] * 100 ).toFixed(0)}%`;
    fearProgress.innerText = `Medo - ${ fearPercentage }%`;

    const happyPercentage = ((emotions[3] * 100).toFixed(0));
    const happyProgress = document.getElementById('progress-bar-happy');
    happyProgress.style.width = `${ (emotions[3] * 100 ).toFixed(0)}%`;
    happyProgress.innerText = `Feliz - ${ happyPercentage }%`;

    const sadPercentage = ((emotions[4] * 100).toFixed(0));
    const sadProgress = document.getElementById('progress-bar-sad');
    sadProgress.style.width = `${ (emotions[4] * 100 ).toFixed(0)}%`;
    sadProgress.innerText = `Triste - ${ sadPercentage }%`;

    const surprisePercentage = ((emotions[5] * 100).toFixed(0));
    const surpriseProgress = document.getElementById('progress-bar-surprise');
    surpriseProgress.style.width = `${ (emotions[5] * 100 ).toFixed(0)}%`;
    surpriseProgress.innerText = `Surpreso - ${ surprisePercentage }%`;

    const neutralPercentage = ((emotions[6] * 100).toFixed(0));
    const neutralProgress = document.getElementById('progress-bar-neutral');
    neutralProgress.style.width = `${ (emotions[6] * 100 ).toFixed(0)}%`;
    neutralProgress.innerText = `Neutro - ${ neutralPercentage }%`;
}

function initializeCanvas() {
    let [w, h] = [video.videoWidth, video.videoHeight];
    canvas.width = w;
    canvas.height = h;
    canvasEmotion.width = w;
    canvasEmotion.height = h;
}

document.querySelector('#showVideo').addEventListener('click', e => {
    init(e);

    setTimeout(() => {
        initializeCanvas();
        getEmotions();
    }, (1000 * 3));
});

let canvas = document.createElement("canvas");
let context = canvas.getContext("2d");

const canvasEmotion = document.getElementById("canvas-emotion");
const contextEmotion = canvasEmotion.getContext("2d");

const video = document.getElementById("gum-local")
const label = document.getElementById('emotion');