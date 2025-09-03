from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
from tensorflow.keras.applications.vgg16 import preprocess_input

app = Flask(__name__)
CORS(app)

MODEL_PATH = "final_vgg16_cnn_finetuned.h5"
model = tf.keras.models.load_model(MODEL_PATH)

CLASS_NAMES = {
    0: "actinic keratosis",
    1: "basal cell carcinoma",
    2: "dermatofibroma",
    3: "melanoma",
    4: "nevus"
}

def prepare_image(image_bytes, target_size=(224, 224)):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(target_size, Image.LANCZOS)
    arr = np.array(img).astype("float32")
    arr = np.expand_dims(arr, axis=0)
    # IMPORTANT: use same preprocessing as during training (VGG16)
    arr = preprocess_input(arr)
    return arr

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    try:
        img_bytes = file.read()
        x = prepare_image(img_bytes)
        preds = model.predict(x)[0]  # shape: (num_classes,)

        # top-3
        top_idx = preds.argsort()[-3:][::-1]
        top3 = [{"index": int(i),
                 "name": CLASS_NAMES[int(i)],
                 "probability": float(preds[int(i)])} for i in top_idx]

        best_i = int(np.argmax(preds))
        return jsonify({
            "predicted_class_index": best_i,
            "predicted_class_name": CLASS_NAMES[best_i],
            "confidence": float(preds[best_i]),
            "top3": top3
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
