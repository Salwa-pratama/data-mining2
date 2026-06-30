import json

def fix_notebook(notebook_path):
    with open(notebook_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    # Remove the last two cells
    nb['cells'] = nb['cells'][:-2]
    
    markdown_cell = {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "### Model Training: XGBoost dengan Data Undersampled (Class 2 diseimbangkan)"
        ]
    }
    
    code_source = [
        "import xgboost as xgb\n",
        "from sklearn.metrics import classification_report, accuracy_score\n",
        "import numpy as np\n",
        "\n",
        "print(\"=== PROSES UNDERSAMPLING KELAS 2 ===\")\n",
        "# Cari index untuk kelas 2 dan kelas lainnya di data training\n",
        "idx_class_2 = np.where(y_train == 2)[0]\n",
        "idx_other = np.where(y_train != 2)[0]\n",
        "\n",
        "# Tentukan target jumlah kelas 2 agar seimbang dengan kelas terbanyak berikutnya (kelas 3)\n",
        "target_size = max([sum(y_train == c) for c in [1, 3, 4]])\n",
        "print(f\"Jumlah awal kelas 2: {len(idx_class_2)}\")\n",
        "print(f\"Jumlah target kelas 2 setelah di-undersample: {target_size}\")\n",
        "\n",
        "# Hapus secara acak (undersample) kelas 2\n",
        "np.random.seed(42)\n",
        "idx_class_2_downsampled = np.random.choice(idx_class_2, size=target_size, replace=False)\n",
        "\n",
        "# Gabungkan dan acak ulang index\n",
        "balanced_idx = np.concatenate([idx_class_2_downsampled, idx_other])\n",
        "np.random.shuffle(balanced_idx)\n",
        "\n",
        "# Buat X_train dan y_train yang baru dan sudah balance\n",
        "X_train_balanced = X_train_scaled[balanced_idx]\n",
        "y_train_balanced = y_train.iloc[balanced_idx]\n",
        "\n",
        "print(f\"Bentuk X_train baru: {X_train_balanced.shape}\")\n",
        "\n",
        "print(\"\\n=== TAHAP: MODEL TRAINING DENGAN XGBOOST (DATA BALANCED) ===\")\n",
        "xgb_model_balanced = xgb.XGBClassifier(\n",
        "    n_estimators=100,\n",
        "    learning_rate=0.1,\n",
        "    max_depth=6,\n",
        "    random_state=42,\n",
        "    n_jobs=-1\n",
        ")\n",
        "\n",
        "# Konversi label dari 1-4 menjadi 0-3 untuk algoritma xgboost\n",
        "y_train_xgb = y_train_balanced - 1\n",
        "y_test_xgb = y_test - 1\n",
        "\n",
        "print(\"🚀 Sedang melakukan training XGBoost dengan data undersampled (tunggu sebentar)...\")\n",
        "xgb_model_balanced.fit(X_train_balanced, y_train_xgb)\n",
        "print(\"✔️ Training Selesai!\")\n",
        "\n",
        "print(\"\\n=== TAHAP: EVALUASI MODEL (DATA BALANCED) ===\")\n",
        "# Melakukan Prediksi\n",
        "y_pred_xgb = xgb_model_balanced.predict(X_test_scaled)\n",
        "\n",
        "# Konversi kembali dari 0-3 ke 1-4\n",
        "y_pred_original = y_pred_xgb + 1\n",
        "\n",
        "print(\"Classification Report:\")\n",
        "print(classification_report(y_test, y_pred_original))\n",
        "print(f\"Accuracy: {accuracy_score(y_test, y_pred_original):.4f}\")\n"
    ]
        
    code_cell = {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": code_source
    }
    
    nb['cells'].append(markdown_cell)
    nb['cells'].append(code_cell)
    
    with open(notebook_path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)

if __name__ == "__main__":
    fix_notebook("project1 copy.ipynb")
