from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import io
import json
import pandas as pd
import numpy as np
import tensorflow as tf
from pathlib import Path
from PIL import Image
import matplotlib
matplotlib.use('Agg') # Ensure no GUI popup
import matplotlib.pyplot as plt
import seaborn as sns
import base64

app = FastAPI(title="Data Mining Project API")

# Setup CORS to allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change to specific origins like localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Path Config ──────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "cat_vs_dog_v2.keras"
DATA_DIR_CATDOG = ROOT / "datasets" / "project2" / "cnn"
DATA_DIR_US = ROOT / "datasets" / "project1" / "US_Accidents_March23.csv"
CLASS_NAMES = ["Cat", "Dog"]
IMG_SIZE = (160, 160)

# ── Global Model Cache ───────────────────────────────────────────
model = None

def load_model():
    global model
    if model is None:
        if MODEL_PATH.exists():
            model = tf.keras.models.load_model(str(MODEL_PATH))
    return model

# ── Helpers for Cat vs Dog ───────────────────────────────────────
def get_class_counts(split_dir: Path):
    counts = {}
    if not split_dir.exists():
        return counts
    for cls_dir in sorted(split_dir.iterdir()):
        if cls_dir.is_dir():
            n = sum(1 for f in cls_dir.rglob("*") if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".webp"})
            counts[cls_dir.name] = n
    return counts

def preprocess(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32)
    return np.expand_dims(arr, 0)

def run_predict(model_instance, img_array: np.ndarray):
    score = float(model_instance.predict(img_array, verbose=0)[0][0])
    cls = CLASS_NAMES[1] if score > 0.5 else CLASS_NAMES[0]
    conf = score * 100 if score > 0.5 else (1 - score) * 100
    return cls, conf, score

@app.get("/")
def root():
    return {"status": "ok", "message": "FastAPI is running"}

@app.get("/api/catdog/status")
def get_model_status():
    if MODEL_PATH.exists():
        sz = MODEL_PATH.stat().st_size / 1e6
        return {"exists": True, "name": MODEL_PATH.name, "size_mb": round(sz, 2)}
    return {"exists": False}

@app.get("/api/catdog/stats")
def get_dataset_stats():
    splits = ["train", "valid", "test"]
    stats = {}
    total = 0
    for split in splits:
        split_dir = DATA_DIR_CATDOG / split
        counts = get_class_counts(split_dir)
        split_total = sum(counts.values())
        stats[split] = {"counts": counts, "total": split_total}
        total += split_total
    return {"stats": stats, "grand_total": total}

@app.post("/api/catdog/predict")
async def predict_image(file: UploadFile = File(...)):
    model_instance = load_model()
    if model_instance is None:
        return {"error": "Model not found. Train the model first."}
    
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify() # Verify integrity
        img = Image.open(io.BytesIO(contents)) # Reopen after verify
    except Exception as e:
        return {"error": f"Invalid image file: {str(e)}"}
    
    arr = preprocess(img)
    cls, conf, raw = run_predict(model_instance, arr)
    
    return {
        "class": cls,
        "confidence": conf,
        "raw_score": raw,
        "filename": file.filename
    }

# ── Helpers for US Accidents ─────────────────────────────────────
def fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", transparent=True)
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

@app.get("/api/us-accidents/eda")
def get_us_accidents_eda():
    if not DATA_DIR_US.exists():
        return {"error": f"Dataset not found at {DATA_DIR_US}"}
        
    try:
        df_p1 = pd.read_csv(DATA_DIR_US, nrows=50000)
        
        # 1. Cuplikan Data
        head_data = df_p1.head(5).fillna("").to_dict(orient="records")
        columns = df_p1.columns.tolist()
        
        # 2. Plot Missing Values (Top 10)
        missing = df_p1.isna().sum()
        missing = missing[missing > 0].sort_values(ascending=False).head(10)
        
        missing_img = None
        if not missing.empty:
            fig_miss, ax_miss = plt.subplots(figsize=(6, 4), facecolor="#0a0a0a")
            ax_miss.set_facecolor("#0a0a0a")
            sns.barplot(x=missing.values, y=missing.index, palette="viridis", ax=ax_miss)
            ax_miss.tick_params(colors="#ededed")
            ax_miss.spines["bottom"].set_color("#333")
            ax_miss.spines["left"].set_color("#333")
            ax_miss.spines["top"].set_visible(False)
            ax_miss.spines["right"].set_visible(False)
            ax_miss.set_xlabel("Jumlah Missing Value", color="#ededed")
            missing_img = fig_to_base64(fig_miss)
            
        # 3. Clean dataframe for subsequent plots
        df_clean = df_p1.copy()
        cols_to_drop = missing[missing > (len(df_p1)*0.5)].index if not missing.empty else []
        df_clean = df_clean.drop(columns=cols_to_drop, errors="ignore")
        for col in df_clean.select_dtypes(include=np.number).columns:
            df_clean[col] = df_clean[col].fillna(df_clean[col].median())
        for col in df_clean.select_dtypes(include=['object']).columns:
            if df_clean[col].isna().sum() > 0:
                df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0])
                
        # 4. Plot Severity
        sev_img = None
        if "Severity" in df_clean.columns:
            fig_sev, ax_sev = plt.subplots(figsize=(5, 4), facecolor="#0a0a0a")
            ax_sev.set_facecolor("#0a0a0a")
            sns.countplot(x="Severity", data=df_clean, palette="viridis", ax=ax_sev)
            ax_sev.tick_params(colors="#ededed")
            ax_sev.spines["bottom"].set_color("#333")
            ax_sev.spines["left"].set_color("#333")
            ax_sev.spines["top"].set_visible(False)
            ax_sev.spines["right"].set_visible(False)
            ax_sev.set_xlabel("Severity", color="#ededed")
            ax_sev.set_ylabel("Count", color="#ededed")
            sev_img = fig_to_base64(fig_sev)
            
        # 5. Plot Temperature
        temp_img = None
        if "Temperature(F)" in df_clean.columns:
            fig_out, ax_out = plt.subplots(figsize=(5, 4), facecolor="#0a0a0a")
            ax_out.set_facecolor("#0a0a0a")
            sns.boxplot(x=df_clean["Temperature(F)"], color="#fff", ax=ax_out)
            ax_out.tick_params(colors="#ededed")
            ax_out.spines["bottom"].set_color("#333")
            ax_out.spines["left"].set_visible(False)
            ax_out.spines["top"].set_visible(False)
            ax_out.spines["right"].set_visible(False)
            ax_out.set_xlabel("Temperature(F)", color="#ededed")
            temp_img = fig_to_base64(fig_out)
            
        return {
            "columns": columns,
            "head_data": head_data,
            "charts": {
                "missing_values": missing_img,
                "severity": sev_img,
                "temperature": temp_img
            }
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/us-accidents/train")
def train_us_accidents():
    """
    Trains the Random Forest model on the fly using 50k rows
    and returns evaluation metrics.
    """
    if not DATA_DIR_US.exists():
        return {"error": f"Dataset not found at {DATA_DIR_US}"}
        
    try:
        df_p1 = pd.read_csv(DATA_DIR_US, nrows=50000)
        
        # 1. Penanganan Missing Values
        missing_before = df_p1.isna().sum()
        cols_to_drop = missing_before[missing_before > (len(df_p1)*0.5)].index
        df_clean = df_p1.drop(columns=cols_to_drop)
        
        num_cols = df_clean.select_dtypes(include=np.number).columns
        for col in num_cols:
            if df_clean[col].isna().sum() > 0:
                df_clean[col] = df_clean[col].fillna(df_clean[col].median())
                
        cat_cols = df_clean.select_dtypes(include=['object']).columns
        for col in cat_cols:
            if df_clean[col].isna().sum() > 0:
                df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0])
                
        # 2. Ekstraksi Fitur
        if "Start_Time" in df_clean.columns:
            df_clean['Start_Time'] = pd.to_datetime(df_clean['Start_Time'], errors='coerce')
            df_clean['Hour'] = df_clean['Start_Time'].dt.hour
            df_clean['DayOfWeek'] = df_clean['Start_Time'].dt.dayofweek
            
        bool_cols = df_clean.select_dtypes(include=['bool']).columns
        if len(bool_cols) > 0:
            df_clean[bool_cols] = df_clean[bool_cols].astype(int)
            
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        if "Weather_Condition" in df_clean.columns:
            df_clean['Weather_Condition_Encoded'] = le.fit_transform(df_clean['Weather_Condition'].astype(str))
            
        # 3. Machine Learning
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
        
        base_features = ['Temperature(F)', 'Humidity(%)', 'Pressure(in)', 'Visibility(mi)', 'Wind_Speed(mph)', 
                         'Hour', 'DayOfWeek', 'Weather_Condition_Encoded']
        poi_features = list(bool_cols)
        all_potential = base_features + poi_features
        selected_features = [f for f in all_potential if f in df_clean.columns]
        
        if 'Severity' not in df_clean.columns:
            return {"error": "Target column 'Severity' missing."}
            
        X = df_clean[selected_features]
        y = df_clean['Severity']
        
        X_y = pd.concat([X, y], axis=1).dropna()
        X_clean = X_y[selected_features]
        y_clean = X_y['Severity']
        
        X_train, X_test, y_train, y_test = train_test_split(X_clean, y_clean, test_size=0.2, random_state=42, stratify=y_clean)
        
        rf_model = RandomForestClassifier(n_estimators=50, max_depth=15, n_jobs=-1, random_state=42)
        rf_model.fit(X_train, y_train)
        
        y_pred = rf_model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        
        report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        cm = confusion_matrix(y_test, y_pred)
        
        importances = rf_model.feature_importances_
        indices = np.argsort(importances)[::-1][:10]
        top_features = [{"feature": selected_features[i], "importance": float(importances[i])} for i in indices]
        
        return {
            "accuracy": acc,
            "test_size": len(X_test),
            "classification_report": report_dict,
            "confusion_matrix": cm.tolist(),
            "top_features": top_features
        }
        
    except Exception as e:
        return {"error": f"Training failed: {str(e)}"}
