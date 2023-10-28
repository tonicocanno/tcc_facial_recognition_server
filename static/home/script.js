//#region global configs

'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
    audio: false,
    video: true
};

//#endregion

//#region Init functions
function type() {
    typingText.textContent += title[typingTextIndex];
    typingTextIndex++;

    if (typingTextIndex < title.length) {
        setTimeout(type, 50);
    } else {
        typingText.style.border = 'none';
    }
}

//#endregion

//#region variables and init

const typingText = document.querySelector('.typing-text');

let typingTextIndex = 0;
const title = "Reconhecimento de emoções";
type();

//#endregion