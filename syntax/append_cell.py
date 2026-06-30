import nbformat
from nbformat.v4 import new_code_cell, new_markdown_cell
import sys

def append_to_notebook(notebook_path):
    with open(notebook_path, 'r', encoding='utf-8') as f:
        nb = nbformat.read(f, as_version=4)
        
    markdown_source = "### Model Training: XGBoost dengan Data Undersampled (Class 2 diseimbangkan)"
    nb.cells.append(new_markdown_cell(source=markdown_source))
    
    code_source = """import xgboost as xgb
from sklearn.metrics import classification_report, accuracy_score
import numpy as np

print("=== PROSES UNDERSAMPLING KELAS 2 ===")
# Cari index untuk kelas 2 dan kelas lainnya di data training
idx_class_2 = np.where(y_train == 2)[0]
idx_other = np.where(y_train != 2)[0]

# Tentukan target jumlah kelas 2 agar seimbang dengan kelas terbanyak berikutnya (kelas 3)
target_size = max([sum(y_train == c) for c in [1, 3, 4]])
print(f"Jumlah awal kelas 2: {len(idx_class_2)}")
print(f"Jumlah target kelas 2 setelah di-undersample: {target_size}")

# Hapus secara acak (undersample) kelas 2
np.random.seed(42)
idx_class_2_downsampled = np.random.choice(idx_class_2, size=target_size, replace=False)

# Gabungkan dan acak ulang index
balanced_idx = np.concatenate([idx_class_2_downsampled, idx_other])
np.random.shuffle(balanced_idx)

# Buat X_train dan y_train yang baru dan sudah balance
X_train_balanced = X_train_scaled[balanced_idx]
y_train_balanced = y_train.iloc[balanced_idx]

print(f"Bentuk X_train baru: {X_train_balanced.shape}")

print("\\n=== TAHAP: MODEL TRAINING DENGAN XGBOOST (DATA BALANCED) ===")
xgb_model_balanced = xgb.XGBClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=6,
    random_state=42,
    n_jobs=-1
)

# Konversi label dari 1-4 menjadi 0-3 untuk algoritma xgboost
y_train_xgb = y_train_balanced - 1
y_test_xgb = y_test - 1

print("🚀 Sedang melakukan training XGBoost dengan data undersampled (tunggu sebentar)...")
xgb_model_balanced.fit(X_train_balanced, y_train_xgb)
print("✔️ Training Selesai!")

print("\\n=== TAHAP: EVALUASI MODEL (DATA BALANCED) ===")
# Melakukan Prediksi
y_pred_xgb = xgb_model_balanced.predict(X_test_scaled)

# Konversi kembali dari 0-3 ke 1-4
y_pred_original = y_pred_xgb + 1

print("Classification Report:")
print(classification_report(y_test, y_pred_original))
print(f"Accuracy: {accuracy_score(y_test, y_pred_original):.4f}")
"""
    nb.cells.append(new_code_cell(source=code_source))
    
    with open(notebook_path, 'w', encoding='utf-8') as f:
        nbformat.write(nb, f)

if __name__ == "__main__":
    append_to_notebook("project1 copy.ipynb")
