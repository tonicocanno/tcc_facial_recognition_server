//#region global configs

'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
    audio: false,
    video: true
};

//#endregion

//#region Init functions

function initProgressBar() {
    const progressBarContainer = document.querySelector('.progress-bar-container');
    progressBarContainer.style.display = 'flex';
    progressBarContainer.style.opacity = 1;
}

function initializeCanvasEmotion(width, height) {
    canvasEmotion.width = width;
    canvasEmotion.height = height;
}

//#endregion

//#region general functions

function getImageBase64FromFile(file, callback) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const base64String = e.target.result;
        callback(base64String);
    };

    return reader.readAsDataURL(file);
}

function getEmotions(image) {
    const request = new Request("/face", {
        method: "POST",
        body: JSON.stringify({ base64: image }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    document.getElementById('emotion').style.opacity = 1;
    label.innerText = 'Detectando emoção...';

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
        });
}

function updateProgressBar(emotion, emotionName, progressId) {
    const percentage = (emotion * 100).toFixed(2);
    const progress = document.getElementById(progressId);
    const progressSpan = progress.querySelector('.progress-bar-fill');
    const progressPercentage = progress.querySelector('.progress-bar-percentage');
    progressSpan.style.width = `${percentage}%`;
    progressPercentage.innerText = `${emotionName} - ${percentage}%`;
}

function loadedImage(selectedFile) {
    canvas = document.createElement("canvas");
    context = canvas.getContext("2d");
    canvasEmotion = document.getElementById("canvas-emotion");
    contextEmotion = canvasEmotion.getContext("2d");

    getImageBase64FromFile(selectedFile, (imageBase64) => {
        const imageBase64WithoutMimetype = imageBase64.split(',')[1];

        image.style.display = 'block';
        image.src = imageBase64;
        dropFile.style.display = 'none';

        image.onload = function() {
            const w = image.naturalWidth;
            const h = image.naturalHeight;

            initializeCanvasEmotion(w, h);
            getEmotions(imageBase64WithoutMimetype);
        };
    })
}

//#endregion

//#region variables and init

const fileInput = document.getElementById('fileInput');

// Define um evento para ser acionado quando o arquivo é selecionado
fileInput.addEventListener('change', function() {
    const selectedFile = fileInput.files[0]; // Obtém o arquivo selecionado

    if (selectedFile) {
        loadedImage(selectedFile);
    }
});

let canvas;
let context;
let canvasEmotion;
let contextEmotion;

const label = document.getElementById('emotion');

const image = document.getElementById("image");

const dropFile = document.getElementById("dropfile");

const initApp = () => {
    const droparea = document.querySelector('.droparea');

    const active = () => droparea.classList.add("green-border");

    const inactive = () => droparea.classList.remove("green-border");

    const prevents = (e) => e.preventDefault();

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
        droparea.addEventListener(evtName, prevents);
    });

    ['dragenter', 'dragover'].forEach(evtName => {
        droparea.addEventListener(evtName, active);
    });

    ['dragleave', 'drop'].forEach(evtName => {
        droparea.addEventListener(evtName, inactive);
    });

    droparea.addEventListener("drop", handleDrop);

}

document.addEventListener("DOMContentLoaded", initApp);

const handleDrop = (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    loadedImage(files[0])
}

//#endregion