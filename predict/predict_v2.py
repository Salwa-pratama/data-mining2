"""
predict_v2.py - Skrip Prediksi Kucing vs Anjing (Cat vs Dog)
=============================================================
Cara Penggunaan:
    python predict_v2.py <path_ke_gambar>

Contoh:
    python predict_v2.py ../datasets/project2/cnn/test/cats/cat.1.jpg

Membutuhkan model yang sudah dilatih:
    ../models/cat_vs_dog_v2.keras

Pastikan sudah menjalankan notebook LatihanCNN_v2.ipynb untuk melatih dan menyimpan model terlebih dahulu.
"""

import sys
import os
import numpy as np
import tensorflow as tf
from pathlib import Path

# ─────────────────────────────────────────────────────────────────
# Konfigurasi
# ─────────────────────────────────────────────────────────────────
IMAGE_SIZE = (160, 160)
SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = SCRIPT_DIR.parent / "models" / "cat_vs_dog_v2.keras"

CLASS_NAMES = ["Cat", "Dog"]  # Sesuai urutan kelas dari dataset (nama folder di-sort secara alfabetis)
CONFIDENCE_THRESHOLD = 0.5    # Batas sigmoid untuk menentukan kelas

# ─────────────────────────────────────────────────────────────────
# Fungsi Utilitas
# ─────────────────────────────────────────────────────────────────

def print_banner():
    """Menampilkan banner aplikasi."""
    print("=" * 55)
    print("   🐱  Cat vs Dog Classifier  🐶")
    print("   Model: Lightweight Custom CNN v2")
    print("=" * 55)

def load_model_safe(model_path: Path):
    """
    Memuat model Keras dengan penanganan error yang baik.
    
    Returns:
        Model TensorFlow/Keras jika berhasil, None jika gagal.
    """
    if not model_path.exists():
        print(f"\n❌ ERROR: Model tidak ditemukan di path berikut:")
        print(f"   {model_path}")
        print("\n💡 Solusi: Jalankan notebook 'syntax/LatihanCNN_v2.ipynb' terlebih dahulu")
        print("   untuk melatih dan menyimpan model.")
        return None
    
    print(f"\n⏳ Memuat model dari: {model_path.name}")
    try:
        model = tf.keras.models.load_model(str(model_path))
        print("✅ Model berhasil dimuat!")
        return model
    except Exception as e:
        print(f"\n❌ ERROR: Gagal memuat model.")
        print(f"   Detail: {e}")
        return None

def preprocess_image(image_path: str):
    """
    Memuat dan memproses gambar untuk diprediksi oleh model.
    
    Preprocessing:
        1. Load gambar sebagai RGB (3 channel).
        2. Resize ke IMAGE_SIZE yang diharapkan oleh model (160x160).
        3. Ekspansi dimensi batch: (H, W, C) → (1, H, W, C).
        (Catatan: Penskalaan piksel ke [0,1] sudah ditangani oleh layer
         Rescaling di dalam model itu sendiri, jadi tidak perlu di sini.)
    
    Returns:
        Numpy array dengan shape (1, 160, 160, 3), atau None jika gagal.
    """
    if not os.path.exists(image_path):
        print(f"\n❌ ERROR: Gambar tidak ditemukan di path:")
        print(f"   {image_path}")
        return None
    
    try:
        # Gunakan tf.keras.utils.load_img untuk memuat gambar
        img = tf.keras.utils.load_img(image_path, target_size=IMAGE_SIZE)
        img_array = tf.keras.utils.img_to_array(img)          # (160, 160, 3), float32
        img_array = np.expand_dims(img_array, axis=0)          # (1, 160, 160, 3)
        return img_array
    except Exception as e:
        print(f"\n❌ ERROR: Gagal membaca gambar.")
        print(f"   Detail: {e}")
        print("   Pastikan file adalah gambar yang valid (jpg, jpeg, png, bmp, webp).")
        return None

def predict(model, img_array: np.ndarray):
    """
    Menjalankan inferensi dan mengembalikan nama kelas beserta confidence.
    
    Args:
        model: Model Keras yang sudah dimuat.
        img_array: Numpy array gambar dengan shape (1, 160, 160, 3).
    
    Returns:
        Tuple (class_name: str, confidence: float, raw_score: float)
        - class_name: "Cat" atau "Dog"
        - confidence: Persentase keyakinan prediksi (0-100%)
        - raw_score: Nilai sigmoid mentah dari output model (0.0 - 1.0)
    """
    raw_score = float(model.predict(img_array, verbose=0)[0][0])
    
    # Kelas "Dog" = 1 (sigmoid > 0.5), Kelas "Cat" = 0 (sigmoid <= 0.5)
    if raw_score > CONFIDENCE_THRESHOLD:
        class_name = CLASS_NAMES[1]  # Dog
        confidence = raw_score * 100
    else:
        class_name = CLASS_NAMES[0]  # Cat
        confidence = (1.0 - raw_score) * 100
    
    return class_name, confidence, raw_score

def print_result(image_path: str, class_name: str, confidence: float, raw_score: float):
    """Menampilkan hasil prediksi dengan format yang rapi."""
    print("\n" + "─" * 55)
    print(f"  📷 Gambar    : {os.path.basename(image_path)}")
    print("─" * 55)
    
    emoji = "🐶" if class_name == "Dog" else "🐱"
    print(f"  {emoji} Prediksi  : {class_name.upper()}")
    
    # Progress bar confidence
    bar_length = 30
    filled = int(bar_length * confidence / 100)
    bar = "█" * filled + "░" * (bar_length - filled)
    print(f"  📊 Confidence: [{bar}] {confidence:.1f}%")
    
    # Skor detail untuk kedua kelas
    cat_pct = (1.0 - raw_score) * 100
    dog_pct = raw_score * 100
    print(f"\n  Detail Skor:")
    print(f"    🐱 Cat : {cat_pct:.2f}%")
    print(f"    🐶 Dog : {dog_pct:.2f}%")
    
    print("─" * 55)
    
    # Pesan berdasarkan confidence level
    if confidence >= 90:
        print("  ✅ Prediksi sangat yakin!")
    elif confidence >= 75:
        print("  ✅ Prediksi cukup yakin.")
    else:
        print("  ⚠️  Prediksi kurang yakin. Gambar mungkin ambigu.")
    
    print("=" * 55 + "\n")

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

def main():
    print_banner()
    
    # Validasi argumen command line
    if len(sys.argv) != 2:
        print("\n❌ ERROR: Argumen tidak lengkap.")
        print("\nCara Penggunaan:")
        print("  python predict_v2.py <path_ke_gambar>")
        print("\nContoh:")
        print("  python predict_v2.py ../datasets/project2/cnn/test/cats/cat.1.jpg")
        print("  python predict_v2.py /path/to/your/image.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # 1. Muat model
    model = load_model_safe(MODEL_PATH)
    if model is None:
        sys.exit(1)
    
    # 2. Preprocessing gambar
    print(f"\n⏳ Memproses gambar: {image_path}")
    img_array = preprocess_image(image_path)
    if img_array is None:
        sys.exit(1)
    
    print(f"✅ Gambar berhasil dimuat (shape: {img_array.shape})")
    
    # 3. Prediksi
    print("\n⏳ Menjalankan prediksi...")
    class_name, confidence, raw_score = predict(model, img_array)
    
    # 4. Tampilkan hasil
    print_result(image_path, class_name, confidence, raw_score)


if __name__ == "__main__":
    main()
