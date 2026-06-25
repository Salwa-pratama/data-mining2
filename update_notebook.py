import json

filename = "syntax/project1.ipynb"
with open(filename, "r", encoding="utf-8") as f:
    nb = json.load(f)

target_idx = -1
for i, cell in enumerate(nb["cells"]):
    if cell["cell_type"] == "code":
        source = "".join(cell.get("source", []))
        if "TAHAP 1: STANDARISASI DATA" in source or "PISAHKAN FITUR" in source:
            target_idx = i

if target_idx != -1:
    new_source = """from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import pandas as pd
import numpy as np

# 1. PISAHKAN FITUR (X) DAN TARGET (y)
X = df_transformed.drop(columns=['Severity'])
y = df_transformed['Severity'].reset_index(drop=True)

print(f"Bentuk data awal: {X.shape[0]} baris, {X.shape[1]} fitur/kolom.")

# 2. LAKUKAN TRAIN-TEST SPLIT DULU (Mencegah Data Leakage)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"Data Training: {X_train.shape[0]} baris | Data Testing: {X_test.shape[0]} baris")

print("\\n=== TAHAP 1: STANDARISASI DATA (STANDARD SCALING) ===")
scaler = StandardScaler()
# FIT HANYA DI X_TRAIN, TRANSFORM DI X_TRAIN DAN X_TEST
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print("✔️ Standarisasi Selesai! Skala fitur sudah disesuaikan tanpa leakage.")

print("\\n=== TAHAP 2: PRINCIPAL COMPONENT ANALYSIS (PCA) - (Untuk Catatan/Analisa) ===")
# PCA untuk melihat informasi (varians) pada data training
pca = PCA()
X_pca_train = pca.fit_transform(X_train_scaled)

cumulative_variance = np.cumsum(pca.explained_variance_ratio_)

print("\\n=== HASIL ANALISIS PCA ===")
for i in range(min(10, len(cumulative_variance))):
    print(f"💡 PC {i+1:<2} mampu mewakili {pca.explained_variance_ratio_[i]*100:<5.2f}% informasi | Total Akumulasi: {cumulative_variance[i]*100:.2f}%")

n_komponen_pilihan = 5
kolom_pc = [f'PC_{i+1}' for i in range(n_komponen_pilihan)]

df_pca_final = pd.DataFrame(X_pca_train[:, :n_komponen_pilihan], columns=kolom_pc)
df_pca_final['Severity'] = y_train.reset_index(drop=True)

print(f"\\n🔥 Data PCA dengan {n_komponen_pilihan} komponen (Catatan Saja):")
display(df_pca_final.head())"""
    
    nb["cells"][target_idx]["source"] = [line + "\n" for line in new_source.split("\n")]
    nb["cells"][target_idx]["source"][-1] = nb["cells"][target_idx]["source"][-1].rstrip('\n')

def create_md_cell(text):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.split("\n")]
    }

def create_code_cell(text):
    source = [line + "\n" for line in text.split("\n")]
    source[-1] = source[-1].rstrip('\n')
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source
    }

cell_xgb_md = create_md_cell("### 🤖 Model Training: XGBoost")
cell_xgb_code = create_code_cell("""import xgboost as xgb
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

print("=== TAHAP 3: MODEL TRAINING DENGAN XGBOOST ===")

# XGBoost mengharuskan label dimulai dari 0. Severity asli (misal 1,2,3,4) kita mapping ke (0,1,2,3)
label_mapping = {val: i for i, val in enumerate(sorted(y_train.unique()))}
inverse_label_mapping = {i: val for val, i in label_mapping.items()}

y_train_xgb = y_train.map(label_mapping)
y_test_xgb = y_test.map(label_mapping)

# Inisialisasi Model XGBoost
model_xgb = xgb.XGBClassifier(
    objective='multi:softmax',
    num_class=len(label_mapping),
    eval_metric='mlogloss',
    random_state=42,
    tree_method='hist' # Sangat cepat untuk ratusan ribu baris data
)

print("🚀 Sedang melakukan training XGBoost (tunggu sebentar)...")
# Gunakan data scaling agar seragam dengan alur preprocessing sebelumnya
model_xgb.fit(X_train_scaled, y_train_xgb)
print("✔️ Training Selesai!")

print("\\n=== TAHAP 4: EVALUASI MODEL ===")
y_pred_xgb = model_xgb.predict(X_test_scaled)

# Kembalikan ke label aslinya untuk diprint di laporan
y_test_asli = y_test_xgb.map(inverse_label_mapping)
y_pred_asli = pd.Series(y_pred_xgb).map(inverse_label_mapping)

print("Classification Report:\\n")
print(classification_report(y_test_asli, y_pred_asli))

plt.figure(figsize=(8, 6))
cm = confusion_matrix(y_test_asli, y_pred_asli)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=label_mapping.keys(), 
            yticklabels=label_mapping.keys())
plt.title('Confusion Matrix XGBoost')
plt.xlabel('Predicted Severity')
plt.ylabel('Actual Severity')
plt.show()""")

cell_xai_md = create_md_cell("### 🔍 Explainable AI (XAI) - Feature Importance")
cell_xai_code = create_code_cell("""print("=== TAHAP 5: EXPLAINABLE AI (XAI) - FEATURE IMPORTANCE ===")
# Menampilkan 20 fitur paling berpengaruh dalam pengambilan keputusan model

# Kita ekstrak feature importances dari model XGBoost
importances = model_xgb.feature_importances_

# Buat dataframe agar mudah diplot
df_importances = pd.DataFrame({
    'Feature': X.columns,
    'Importance': importances
}).sort_values(by='Importance', ascending=False)

top_20_features = df_importances.head(20)

plt.figure(figsize=(10, 8))
sns.barplot(x='Importance', y='Feature', data=top_20_features, palette='viridis')
plt.title('Top 20 Fitur Paling Berpengaruh (XGBoost)')
plt.xlabel('Tingkat Kepentingan (Importance)')
plt.ylabel('Fitur')
plt.show()

print("💡 Insight: Fitur-fitur di atas adalah faktor utama yang membedakan tingkat Severity kecelakaan.")""")

cell_pred_md = create_md_cell("### 🔮 Prediksi Data Baru")
cell_pred_code = create_code_cell("""print("=== TAHAP 6: PREDIKSI DATA BARU ===")

# Simulasi mengambil 1 baris data "baru" (kita comot dari baris pertama X_test)
data_baru = X_test.iloc[[0]].copy() 

print("Data Baru yang masuk (kondisi masih raw / belum discale):")
display(data_baru.head())

# Langkah 1: Scaling data baru tersebut menggunakan scaler yang FIT-nya dari X_train
data_baru_scaled = scaler.transform(data_baru)

# Langkah 2: Prediksi dengan model XGBoost
prediksi_baru = model_xgb.predict(data_baru_scaled)

# Langkah 3: Kembalikan angka prediksi ke label Severity aslinya
hasil_severity = inverse_label_mapping[prediksi_baru[0]]

print(f"\\n🔮 HASIL PREDIKSI: Model menebak kecelakaan ini memiliki Severity Level {hasil_severity}")
print(f"📊 FAKTA SEBENARNYA: Severity asli dari baris data ini adalah Level {y_test.iloc[0]}")
""")

if target_idx != -1:
    nb["cells"] = nb["cells"][:target_idx+1]
    nb["cells"].extend([cell_xgb_md, cell_xgb_code, cell_xai_md, cell_xai_code, cell_pred_md, cell_pred_code])
    
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=1)
    print("Notebook updated successfully!")
else:
    print("Could not find the target cell to update.")
