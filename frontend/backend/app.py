from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pickle
import shutil
import numpy as np
from pathlib import Path
from typing import List, Dict, Union
import io

app = FastAPI(title="US Accidents Severity Predictor API", version="1.0.0")

# Setup CORS to allow cross-origin requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Path Configurations ──────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
MODEL_DIR = BACKEND_DIR / "model"
WORKSPACE_ROOT = BACKEND_DIR.parent.parent
SOURCE_DIR = WORKSPACE_ROOT / "done" / "model.pkl"

# Expected files
MODEL_FILE = "UsAccidnt-Model(baru).pkl"
SCALER_FILE = "us-scaler.pkl"
EVAL_FILE = "us-evaluation.pkl"

# ── Auto-copy helper ─────────────────────────────────────────────
def ensure_model_files():
    """Ensure pickle files exist in frontend/backend/model/, copy from done/model.pkl if missing."""
    if not MODEL_DIR.exists():
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {MODEL_DIR}")

    files_to_check = [MODEL_FILE, SCALER_FILE, EVAL_FILE]
    for filename in files_to_check:
        target_path = MODEL_DIR / filename
        if not target_path.exists():
            source_path = SOURCE_DIR / filename
            if source_path.exists():
                print(f"Copying {filename} from {source_path} to {target_path}...")
                shutil.copy(source_path, target_path)
            else:
                print(f"Warning: Source file {source_path} not found.")

ensure_model_files()

# ── Load Models and Scaler ──────────────────────────────────────
model = None
scaler = None
evaluation_report = ""
feature_names = []

# ── Load Cat vs Dog Keras Model ──────────────────────────────────
catdog_model = None
CATDOG_MODEL_FILE = "cat_vs_dog_v2.keras"

try:
    import tensorflow as tf
    catdog_model_path = MODEL_DIR / CATDOG_MODEL_FILE
    if catdog_model_path.exists():
        catdog_model = tf.keras.models.load_model(str(catdog_model_path))
        print("✅ Cat vs Dog Keras model loaded successfully.")
    else:
        print(f"⚠️ Cat vs Dog model not found at {catdog_model_path}")
except Exception as e:
    print(f"❌ Failed to load Cat vs Dog model: {e}")

try:
    model_path = MODEL_DIR / MODEL_FILE
    if model_path.exists():
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        print("✅ XGBoost model loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load XGBoost model: {e}")

try:
    scaler_path = MODEL_DIR / SCALER_FILE
    if scaler_path.exists():
        with open(scaler_path, "rb") as f:
            scaler = pickle.load(f)
        print("✅ StandardScaler loaded successfully.")
        if hasattr(scaler, "feature_names_in_"):
            feature_names = list(scaler.feature_names_in_)
            print(f"ℹ️ Scaler feature names loaded (count: {len(feature_names)}).")
except Exception as e:
    print(f"❌ Failed to load StandardScaler: {e}")

try:
    eval_path = MODEL_DIR / EVAL_FILE
    if eval_path.exists():
        with open(eval_path, "rb") as f:
            evaluation_report = pickle.load(f)
        print("✅ Evaluation report loaded successfully.")
except Exception as e:
    # Fallback to loading as text if it wasn't pickled as string
    try:
        if eval_path.exists():
            with open(eval_path, "r", encoding="utf-8") as f:
                evaluation_report = f.read()
            print("✅ Evaluation report loaded as text successfully.")
    except Exception as e2:
        print(f"❌ Failed to load evaluation report: {e2}")

# ── Pydantic Request Schema ──────────────────────────────────────
class PredictRequest(BaseModel):
    # Expects either a list of 113 float features or a dict mapping feature names to floats
    features: Union[List[float], Dict[str, float]]
    is_scaled: bool = False

class PredictBatchRequest(BaseModel):
    # Expects a list of dicts mapping feature names to values
    batch: List[Dict[str, Union[float, bool, int, None]]]
    is_scaled: bool = False

# ── API Endpoints ────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "US Accidents Prediction Backend is running",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None
    }

@app.get("/api/status")
def get_status():
    model_name = model.__class__.__name__ if model else None
    scaler_name = scaler.__class__.__name__ if scaler else None

    return {
        "model": {
            "name": model_name,
            "file": MODEL_FILE,
            "loaded": model is not None
        },
        "scaler": {
            "name": scaler_name,
            "file": SCALER_FILE,
            "loaded": scaler is not None,
            "features_expected": len(feature_names) if feature_names else 113,
            "feature_names": feature_names
        }
    }

@app.get("/api/evaluation")
def get_evaluation():
    if not evaluation_report:
        raise HTTPException(status_code=404, detail="Evaluation report not loaded or not found.")
    return {
        "report": evaluation_report
    }

@app.post("/api/predict")
def predict_severity(req: PredictRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="XGBoost model is not loaded on the server.")
    if scaler is None:
        raise HTTPException(status_code=500, detail="StandardScaler is not loaded on the server.")

    # Determine expected feature count (default 113)
    expected_count = len(feature_names) if feature_names else 113

    # Process features input
    if isinstance(req.features, list):
        if len(req.features) != expected_count:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid feature count. Expected {expected_count} features, got {len(req.features)}."
            )
        raw_features = np.array(req.features).reshape(1, -1)
    else:
        # Input is a dictionary
        if not feature_names:
            raise HTTPException(
                status_code=400,
                detail="Feature name mapping is unavailable from the loaded scaler. Please pass features as an ordered list of floats."
            )

        # Reconstruct list from dictionary based on expected feature names
        features_list = []
        for name in feature_names:
            features_list.append(req.features.get(name, 0.0))

        raw_features = np.array(features_list).reshape(1, -1)

    try:
        # Scale the features if not already scaled
        if req.is_scaled:
            processed_features = raw_features
        else:
            processed_features = scaler.transform(raw_features)

        # Run predictions
        pred_class = int(model.predict(processed_features)[0])

        # XGBoost was trained with mapped target variables (1,2,3,4) mapped to (0,1,2,3)
        # Severity level = mapped class + 1
        predicted_severity = pred_class + 1

        # Calculate prediction probabilities if available
        confidence = 1.0
        probabilities = {}
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(processed_features)[0]
            confidence = float(probs[pred_class])
            probabilities = {str(i + 1): float(prob) for i, prob in enumerate(probs)}

        return {
            "predicted_class": pred_class,
            "severity": predicted_severity,
            "confidence": confidence,
            "probabilities": probabilities
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/api/predict/batch")
def predict_severity_batch(req: PredictBatchRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="XGBoost model is not loaded on the server.")
    if scaler is None:
        raise HTTPException(status_code=500, detail="StandardScaler is not loaded on the server.")

    if not feature_names:
        raise HTTPException(
            status_code=400,
            detail="Feature name mapping is unavailable from the loaded scaler. Please pass features as an ordered list of floats."
        )

    # Reconstruct lists from dictionaries based on expected feature names
    features_matrix = []
    for item in req.batch:
        features_list = []
        for name in feature_names:
            val = item.get(name, 0.0)
            if isinstance(val, bool):
                val = 1.0 if val else 0.0
            elif val is None:
                val = 0.0
            try:
                features_list.append(float(val))
            except (ValueError, TypeError):
                features_list.append(0.0)
        features_matrix.append(features_list)

    raw_features = np.array(features_matrix)

    try:
        # Scale the features if not already scaled
        if req.is_scaled:
            processed_features = raw_features
        else:
            processed_features = scaler.transform(raw_features)

        # Run predictions
        pred_classes = model.predict(processed_features)

        # Calculate prediction probabilities if available
        probs = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(processed_features)

        results = []
        for i, pred_class_val in enumerate(pred_classes):
            pred_class = int(pred_class_val)
            predicted_severity = pred_class + 1
            confidence = float(probs[i][pred_class]) if probs is not None else 1.0
            probabilities = {str(j + 1): float(prob) for j, prob in enumerate(probs[i])} if probs is not None else {}

            results.append({
                "predicted_class": pred_class,
                "severity": predicted_severity,
                "confidence": confidence,
                "probabilities": probabilities
            })

        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

# ── Cat vs Dog Endpoints ─────────────────────────────────────────
@app.get("/api/catdog/status")
def catdog_status():
    return {
        "model_loaded": catdog_model is not None,
        "model_file": CATDOG_MODEL_FILE,
        "input_shape": list(catdog_model.input_shape) if catdog_model else None
    }

@app.post("/api/catdog/predict")
async def predict_catdog(file: UploadFile = File(...)):
    if catdog_model is None:
        raise HTTPException(status_code=500, detail="Cat vs Dog model is not loaded on the server.")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar (JPEG, PNG, dll).")

    try:
        import tensorflow as tf
        from PIL import Image

        # Read uploaded image bytes
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")

        # Determine target image size (default to 160x160 as in app/app.py)
        h, w = 160, 160
        input_shape = catdog_model.input_shape
        if isinstance(input_shape, list):
            input_shape = input_shape[0]

        if input_shape and len(input_shape) >= 3:
            h = input_shape[1] if input_shape[1] is not None else 160
            w = input_shape[2] if input_shape[2] is not None else 160

        img = img.resize((w, h))

        # Convert to numpy (without division by 255.0, as in app/app.py)
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)  # shape: (1, H, W, 3)

        # Run prediction
        prediction = catdog_model.predict(img_array, verbose=0)

        # Handle both binary (sigmoid) and categorical (softmax) outputs
        if prediction.shape[-1] == 1:
            # Binary classification: sigmoid output
            prob_dog = float(prediction[0][0])
            prob_cat = 1.0 - prob_dog
            label = "Dog" if prob_dog >= 0.5 else "Cat"
            confidence = prob_dog if prob_dog >= 0.5 else prob_cat
        else:
            # Categorical: [cat_prob, dog_prob]
            prob_cat = float(prediction[0][0])
            prob_dog = float(prediction[0][1])
            label = "Dog" if prob_dog > prob_cat else "Cat"
            confidence = max(prob_cat, prob_dog)

        return {
            "label": label,
            "confidence": confidence,
            "probabilities": {
                "cat": prob_cat,
                "dog": prob_dog
            },
            "filename": file.filename
        }

    except Exception as e:
        import traceback
        traceback.print_exc()  # Print the full error stack trace to the backend terminal
        raise HTTPException(status_code=500, detail=f"Prediksi gagal: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
