import os

os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

import cv2
import numpy as np
import pandas as pd
from PIL import Image
from base64 import b64decode
import tensorflow
import zipfile
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from flask import Flask, jsonify, request, render_template
import io, base64
from PIL import Image

app = Flask(__name__, static_folder='static')

cascade_faces = 'assets/haarcascade_frontalface_default.xml'
caminho_modelo = 'assets/modelo_01_expressoes.h5'
expressoes = ["Raiva", "Nojo", "Medo", "Feliz", "Triste", "Surpreso", "Neutro"]

face_detection = cv2.CascadeClassifier(cascade_faces)
classificador_emocoes = load_model(caminho_modelo, compile=False)

def detectar_emocoes(imagem):
    original = imagem.copy()
    cinza = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)
    faces = face_detection.detectMultiScale(cinza, scaleFactor=1.1, minNeighbors=3, minSize=(20, 20))

    if len(faces) > 0:
        fX, fY, fW, fH = faces[0]
        roi = cinza[fY:fY + fH, fX:fX + fW]
        roi = cv2.resize(roi, (48, 48))
        roi = roi.astype("float") / 255.0
        roi = img_to_array(roi)
        roi = np.expand_dims(roi, axis=0)
        preds = classificador_emocoes.predict(roi)[0]
        emotion_probability = np.max(preds)
        label = expressoes[preds.argmax()]

        return label, float(emotion_probability), faces, preds

    else:
        return '', 0, np.array([]), np.array([])


def exibir_probabilidades(imagem, preds):
    h, w, _ = imagem.shape
    bar_max_width = 150  # Largura máxima da barra
    bar_height = 20      # Altura da barra
    padding = 10         # Espaçamento entre as barras
    text_space = 100     # Espaço reservado para o texto da emoção

    # Ponto inicial para desenhar as barras, começando do canto inferior esquerdo
    y_start = h - (len(expressoes) * (bar_height + padding))

    for (i, (emotion, prob)) in enumerate(zip(expressoes, preds)):
        text = "{}: {:.2f}%".format(emotion, prob * 100)
        bar_width = int(prob * bar_max_width)

        # Coordenadas para desenhar a barra
        y_current = y_start + i * (bar_height + padding)
        cv2.rectangle(imagem, (w - bar_max_width - text_space, y_current),
                      (w - bar_max_width + bar_width - text_space, y_current + bar_height),
                      (200, 250, 20), -1)

        # Colocar o texto da emoção à esquerda da barra
        cv2.putText(imagem, text, (w - bar_max_width - text_space - 5, y_current + bar_height // 2 + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

def convert_image_to_numpy_array(image_data):
  return np.asarray(image_data)


@app.post("/face")
def getEmotion():
    img = Image.open(io.BytesIO(base64.decodebytes(bytes(request.json.get('base64'), "utf-8"))))

    img = convert_image_to_numpy_array(img)

    # Convertendo formato de cor da imagem
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Inverte a ordem dos canais (utilizar caso a imagem capturada fique com cores invertidas)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    
    label, emotion_probability, faces, preds = detectar_emocoes(img)
    return jsonify({ 'label': label, 'emotion_probability': emotion_probability, 'faces': faces.tolist(), 'preds': preds.tolist() })

@app.get("/")
def getIndex():
    return render_template("index.html")

@app.get("/recognition")
def getRecognition():
    return render_template("recognition.html")