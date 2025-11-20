from fastapi import FastAPI, File, UploadFile
import uvicorn
import tensorflow as tf
from tensorflow import keras
from io import BytesIO
from PIL import Image
import numpy as np

app = FastAPI()
model = keras.models.load_model('ml-model/models/mobilenetv2_plant_model.h5')  # path to your trained model

def read_imagefile(file) -> np.ndarray:
    image = Image.open(BytesIO(file))
    image = image.resize((224, 224))
    image = np.array(image) / 255.0
    return np.expand_dims(image, axis=0)

@app.post('/predict/')
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    img = read_imagefile(img_bytes)
    pred = model.predict(img)[0]
    result = int(np.argmax(pred))
    conf = float(np.max(pred))
    return {"class_index": result, "confidence": conf}

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
