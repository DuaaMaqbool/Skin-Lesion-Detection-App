from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
from waitress import serve  # <-- import Waitress

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # enable CORS so frontend can connect

# Load trained model
MODEL_PATH = "backend/final_vgg16_cnn_finetuned.h5"
model = tf.keras.models.load_model(MODEL_PATH)

# Mapping class indices to names
CLASS_NAMES = {
    0: "actinic keratosis",
    1: "basal cell carcinoma",
    2: "dermatofibroma",
    3: "melanoma",
    4: "nevus"
}

# Prediction endpoint
@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    try:
        img = Image.open(io.BytesIO(file.read()))
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        prediction = model.predict(img_array)
        predicted_class = int(np.argmax(prediction, axis=1)[0])
        confidence = float(np.max(prediction))

        return jsonify({
            "predicted_class_index": predicted_class,
            "predicted_class_name": CLASS_NAMES[predicted_class],
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Serve the frontend build (optional)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    from flask import send_from_directory
    import os
    frontend_build_dir = os.path.join(os.getcwd(), "frontend", "build")
    if path != "" and os.path.exists(os.path.join(frontend_build_dir, path)):
        return send_from_directory(frontend_build_dir, path)
    else:
        return send_from_directory(frontend_build_dir, "index.html")


# Run app with Waitress in production
if __name__ == "__main__":
    print("Starting server on http://0.0.0.0:5000")
    serve(app, host="0.0.0.0", port=5000)
