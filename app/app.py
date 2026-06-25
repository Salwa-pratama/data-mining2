"""
app.py - Streamlit App: Cat vs Dog Classifier
Jalankan dengan: streamlit run app/app.py
"""

import os
import sys
import json
import pandas as pd
import numpy as np
import streamlit as st
import tensorflow as tf
from pathlib import Path
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns

# ── Path Config ──────────────────────────────────────────────────
ROOT       = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "cat_vs_dog_v2.keras"
DATA_DIR   = ROOT / "datasets" / "project2" / "cnn"
CLASS_NAMES = ["Cat", "Dog"]
IMG_SIZE   = (160, 160)

# ── Page Setup ───────────────────────────────────────────────────
st.set_page_config(
    page_title="Cat vs Dog Classifier",
    page_icon="🐾",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ───────────────────────────────────────────────────
st.markdown("""
<style>
    [data-testid="stSidebar"] { background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); }
    [data-testid="stSidebar"] * { color: #e0e0e0 !important; }
    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] {
        background: #16213e; border-radius: 8px 8px 0 0;
        color: #aaa; padding: 10px 24px; font-weight: 600;
    }
    .stTabs [aria-selected="true"] { background: #0f3460 !important; color: white !important; }
    .result-card {
        background: linear-gradient(135deg, #0f3460, #16213e);
        border-radius: 16px; padding: 28px;
        border: 1px solid #e94560; margin-top: 16px;
        box-shadow: 0 8px 32px rgba(233,69,96,0.15);
    }
    .metric-box {
        background: #1a1a2e; border-radius: 12px;
        padding: 16px; border: 1px solid #0f3460;
        text-align: center;
    }
    .stat-card {
        background: linear-gradient(135deg, #0f3460, #1a1a2e);
        border-radius: 12px; padding: 20px;
        border-left: 4px solid #e94560; margin-bottom: 12px;
    }
    h1 { color: #e94560 !important; }
    .stButton > button {
        background: linear-gradient(135deg, #e94560, #c62a47);
        color: white; font-weight: 700; border: none;
        border-radius: 10px; padding: 12px 32px;
        font-size: 16px; width: 100%;
        transition: all 0.3s ease;
    }
    .stButton > button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(233,69,96,0.4); }
</style>
""", unsafe_allow_html=True)


# ── Helpers ──────────────────────────────────────────────────────
@st.cache_resource(show_spinner="🔄 Memuat model...")
def load_model():
    if not MODEL_PATH.exists():
        return None
    return tf.keras.models.load_model(str(MODEL_PATH))


def count_images(folder: Path):
    """Hitung gambar dan deteksi corrupt."""
    valid_ext = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    total, corrupt = 0, []
    if not folder.exists():
        return 0, []
    for f in folder.rglob("*"):
        if f.suffix.lower() in valid_ext:
            total += 1
            try:
                with Image.open(f) as img:
                    img.verify()
            except Exception:
                corrupt.append(str(f))
    return total, corrupt


def get_class_counts(split_dir: Path):
    """Hitung gambar per kelas."""
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


def run_predict(model, img_array: np.ndarray):
    score = float(model.predict(img_array, verbose=0)[0][0])
    cls = CLASS_NAMES[1] if score > 0.5 else CLASS_NAMES[0]
    conf = score * 100 if score > 0.5 else (1 - score) * 100
    return cls, conf, score


# ── Navigation Sidebar ───────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🧭 Menu Navigasi")
    page = st.radio(
        "Pilih Halaman:",
        ["🔮 Prediksi Gambar", "📊 Analisis Training", "🚦 Analisis US Accidents"],
        label_visibility="collapsed"
    )
    st.markdown("---")
    st.caption("© 2026 · Data Mining Project")


# ══════════════════════════════════════════════════════════════════
# HALAMAN 1 — PREDIKSI
# ══════════════════════════════════════════════════════════════════
if page == "🔮 Prediksi Gambar":
    st.title("🔮 Prediksi Gambar")
    
    st.markdown("### ℹ️ Informasi Sistem")
    col_info1, col_info2 = st.columns(2)
    with col_info1:
        if MODEL_PATH.exists():
            sz = MODEL_PATH.stat().st_size / 1e6
            st.success(f"✅ Model: `{MODEL_PATH.name}` (📦 {sz:.1f} MB)")
        else:
            st.error("❌ Model belum ada. Silakan jalankan `LatihanCNN_v2.ipynb`")
    with col_info2:
        st.info("Input: `160×160 px` | Arch: Lightweight CNN | Output: Binary")
        
    st.markdown("---")
    st.markdown("Upload foto kucing atau anjing, lalu tekan **Predict** untuk melihat hasilnya.")
    st.markdown("---")

    col_upload, col_result = st.columns([1, 1], gap="large")

    with col_upload:
        st.subheader("📤 Upload Gambar")
        uploaded = st.file_uploader(
            "Pilih gambar (JPG, PNG, WEBP, BMP)",
            type=["jpg", "jpeg", "png", "webp", "bmp"],
            label_visibility="collapsed"
        )

        if uploaded:
            pil_img = Image.open(uploaded)
            st.image(pil_img, caption=f"📷 {uploaded.name}", use_container_width=True)
            st.markdown(f"**Ukuran asli:** {pil_img.size[0]} × {pil_img.size[1]} px")
            st.markdown(f"**Format:** {pil_img.format or uploaded.type}")
            st.markdown(f"**Ukuran file:** {uploaded.size / 1024:.1f} KB")
        else:
            st.markdown(
                """
                <div style='background:#1a1a2e;border:2px dashed #0f3460;border-radius:16px;
                padding:60px;text-align:center;color:#666;'>
                <h2>🖼️</h2>
                <p>Drag & drop atau klik untuk upload gambar</p>
                </div>
                """, unsafe_allow_html=True
            )

        if uploaded:
            predict_btn = st.button("🚀 Predict Sekarang!", use_container_width=True)
        else:
            st.button("🚀 Predict Sekarang!", disabled=True, use_container_width=True)
            predict_btn = False

    with col_result:
        st.subheader("🎯 Hasil Prediksi")

        if uploaded and predict_btn:
            model = load_model()
            if model is None:
                st.error("❌ Model tidak ditemukan. Silakan latih model terlebih dahulu!")
            else:
                with st.spinner("🧠 Menganalisis gambar..."):
                    arr = preprocess(pil_img)
                    cls, conf, raw = run_predict(model, arr)

                emoji = "🐱" if cls == "Cat" else "🐶"
                color = "#3b82f6" if cls == "Cat" else "#f59e0b"

                # Kartu utama hasil
                st.markdown(f"""
                <div class="result-card">
                    <div style="text-align:center;">
                        <div style="font-size:72px;">{emoji}</div>
                        <h1 style="color:{color};font-size:48px;margin:8px 0;">{cls.upper()}</h1>
                        <p style="color:#aaa;font-size:16px;">Prediksi model</p>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                st.markdown("**📊 Detail Confidence:**")

                # Progress bar Cat
                cat_pct = (1 - raw) * 100
                dog_pct = raw * 100

                col_a, col_b = st.columns(2)
                with col_a:
                    st.metric("🐱 Cat", f"{cat_pct:.1f}%")
                    st.progress(cat_pct / 100)
                with col_b:
                    st.metric("🐶 Dog", f"{dog_pct:.1f}%")
                    st.progress(dog_pct / 100)

                # Status keyakinan
                st.markdown("---")
                if conf >= 90:
                    st.success(f"✅ Model **sangat yakin** ({conf:.1f}%) bahwa ini adalah **{cls}**!")
                elif conf >= 75:
                    st.info(f"ℹ️ Model **cukup yakin** ({conf:.1f}%) bahwa ini adalah **{cls}**.")
                else:
                    st.warning(f"⚠️ Model **kurang yakin** ({conf:.1f}%). Gambar mungkin ambigu atau tidak jelas.")

                # Gauge chart
                fig, ax = plt.subplots(figsize=(5, 2.5), facecolor="#0d1117")
                ax.set_facecolor("#0d1117")
                categories = CLASS_NAMES
                values = [cat_pct, dog_pct]
                bar_colors = ["#3b82f6", "#f59e0b"]
                bars = ax.barh(categories, values, color=bar_colors, height=0.5, edgecolor="none")
                for bar, val in zip(bars, values):
                    ax.text(min(val + 1, 95), bar.get_y() + bar.get_height() / 2,
                            f"{val:.1f}%", va="center", color="white", fontweight="bold", fontsize=12)
                ax.set_xlim(0, 100)
                ax.set_xlabel("Confidence (%)", color="#aaa")
                ax.tick_params(colors="white")
                ax.spines["top"].set_visible(False)
                ax.spines["right"].set_visible(False)
                ax.spines["bottom"].set_color("#333")
                ax.spines["left"].set_color("#333")
                ax.xaxis.label.set_color("#aaa")
                st.pyplot(fig)
                plt.close()

        elif not uploaded:
            st.markdown(
                """
                <div style='background:#1a1a2e;border-radius:16px;padding:60px;
                text-align:center;color:#666;height:100%;'>
                <h2>⬅️</h2>
                <p>Upload gambar terlebih dahulu,<br>lalu tekan tombol Predict.</p>
                </div>
                """, unsafe_allow_html=True
            )


# ══════════════════════════════════════════════════════════════════
# HALAMAN 2 — ANALISIS TRAINING
# ══════════════════════════════════════════════════════════════════
if page == "📊 Analisis Training":
    st.title("📊 Analisis Dataset & Training")
    st.markdown("Halaman ini menampilkan statistik lengkap dataset, data corrupt, dan evaluasi model.")
    st.markdown("---")

    # ── Section 1: Info Dataset ──────────────────────────────────
    st.subheader("📁 Informasi Dataset")
    st.markdown("**Path Direktori Dataset:**")
    st.code(str(DATA_DIR), language=None)

    splits = ["train", "valid", "test"]
    split_labels = {"train": "Training", "valid": "Validasi", "test": "Testing"}
    split_colors = {"train": "#3b82f6", "valid": "#10b981", "test": "#f59e0b"}

    if not DATA_DIR.exists():
        st.error(f"❌ Folder dataset tidak ditemukan: `{DATA_DIR}`")
    else:
        overview_cols = st.columns(3)
        all_stats = {}

        for i, split in enumerate(splits):
            split_dir = DATA_DIR / split
            with st.spinner(f"Menghitung {split_labels[split]}..."):
                counts = get_class_counts(split_dir)
            total = sum(counts.values())
            all_stats[split] = {"counts": counts, "total": total}

            with overview_cols[i]:
                color = split_colors[split]
                st.markdown(f"""
                <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);border-radius:12px;
                padding:20px;border-top:4px solid {color};text-align:center;">
                    <h3 style="color:{color};margin:0;">{split_labels[split]}</h3>
                    <h1 style="font-size:42px;margin:8px 0;">{total:,}</h1>
                    <p style="color:#aaa;margin:0;">total gambar</p>
                </div>
                """, unsafe_allow_html=True)

        # ── Per-class breakdown ───────────────────────────────────
        st.markdown("#### 🐱🐶 Distribusi Per Kelas")

        for split in splits:
            counts = all_stats[split]["counts"]
            total  = all_stats[split]["total"]
            if not counts:
                continue

            color = split_colors[split]
            st.markdown(f"**{split_labels[split]}**")
            cls_cols = st.columns(len(counts) + 1)

            for j, (cls, n) in enumerate(counts.items()):
                pct = (n / total * 100) if total > 0 else 0
                with cls_cols[j]:
                    st.markdown(f"""
                    <div class="metric-box">
                        <p style="color:#aaa;margin:0;">{'🐱' if cls=='Cat' else '🐶'} {cls}</p>
                        <h2 style="color:{color};margin:4px 0;">{n:,}</h2>
                        <p style="color:#888;font-size:12px;margin:0;">{pct:.1f}% dari split</p>
                    </div>
                    """, unsafe_allow_html=True)

            with cls_cols[-1]:
                balance = "✅ Seimbang" if counts and abs(list(counts.values())[0] - list(counts.values())[-1]) / total < 0.05 else "⚠️ Tidak Seimbang"
                st.markdown(f"""
                <div class="metric-box">
                    <p style="color:#aaa;margin:0;">Status</p>
                    <p style="font-size:20px;margin:4px 0;">{balance}</p>
                    <p style="color:#888;font-size:12px;margin:0;">rasio kelas</p>
                </div>
                """, unsafe_allow_html=True)

        # ── Pie charts distribusi ─────────────────────────────────
        st.markdown("#### 📈 Grafik Distribusi Split")
        total_per_split = {s: all_stats[s]["total"] for s in splits}
        grand_total = sum(total_per_split.values())

        fig, axes = plt.subplots(1, 4, figsize=(16, 4), facecolor="#0d1117")
        # Pie: split distribution
        ax = axes[0]
        ax.set_facecolor("#0d1117")
        sizes = [total_per_split[s] for s in splits]
        colors_pie = ["#3b82f6", "#10b981", "#f59e0b"]
        wedges, texts, autotexts = ax.pie(
            sizes, labels=[split_labels[s] for s in splits],
            colors=colors_pie, autopct="%1.1f%%", startangle=90,
            textprops={"color": "white", "fontsize": 10}
        )
        ax.set_title("Distribusi Split", color="white", fontweight="bold")

        # Bar per class per split
        for idx, split in enumerate(splits):
            ax = axes[idx + 1]
            ax.set_facecolor("#0d1117")
            counts = all_stats[split]["counts"]
            if counts:
                cls_list = list(counts.keys())
                vals = list(counts.values())
                bar_c = ["#3b82f6" if c == "Cat" else "#f59e0b" for c in cls_list]
                bars = ax.bar(cls_list, vals, color=bar_c, edgecolor="none", width=0.5)
                for bar, v in zip(bars, vals):
                    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 10,
                            f"{v:,}", ha="center", color="white", fontsize=10, fontweight="bold")
                ax.set_title(f"{split_labels[split]}", color="white", fontweight="bold")
                ax.tick_params(colors="white")
                ax.spines["top"].set_visible(False)
                ax.spines["right"].set_visible(False)
                ax.spines["left"].set_color("#333")
                ax.spines["bottom"].set_color("#333")
                ax.set_facecolor("#0d1117")
                ax.yaxis.label.set_color("white")
                ax.xaxis.label.set_color("white")

        plt.tight_layout()
        st.pyplot(fig)
        plt.close()

        # ── Grand total ───────────────────────────────────────────
        st.markdown(f"""
        <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);border-radius:12px;
        padding:16px;text-align:center;border:1px solid #e94560;margin-top:8px;">
            <span style="color:#aaa;">Total keseluruhan dataset: </span>
            <strong style="color:#e94560;font-size:24px;">{grand_total:,} gambar</strong>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("---")

     

        # ── Section 3: Evaluasi Model ────────────────────────────
        st.subheader("🏆 Evaluasi Model")

        model = load_model()
        if model is None:
            st.warning("""
            ⚠️ **Model belum tersedia.**

            Untuk mengevaluasi model:
            1. Buka `syntax/LatihanCNN_v2.ipynb`
            2. Jalankan semua cell
            3. Model akan tersimpan di `models/cat_vs_dog_v2.keras`
            4. Refresh halaman ini
            """)
        else:
            st.success(f"✅ Model **{MODEL_PATH.name}** berhasil dimuat!")

            # Model info
            col_m1, col_m2, col_m3 = st.columns(3)
            total_params = model.count_params()
            trainable_params = sum(tf.size(v).numpy() for v in model.trainable_variables)
            non_trainable_params = total_params - trainable_params

            with col_m1:
                st.metric("📦 Total Parameter", f"{total_params:,}")
            with col_m2:
                st.metric("🔧 Trainable Params", f"{trainable_params:,}")
            with col_m3:
                st.metric("🔒 Non-Trainable", f"{non_trainable_params:,}")

            # Arsitektur ringkas
            st.markdown("#### 🏗️ Arsitektur Model")
            arch_rows = []
            for layer in model.layers:
                out_shape = str(layer.output.shape) if hasattr(layer, "output") else "N/A"
                n_params = layer.count_params()
                arch_rows.append({
                    "Layer": layer.name,
                    "Tipe": layer.__class__.__name__,
                    "Output Shape": out_shape,
                    "Parameter": f"{n_params:,}"
                })
            import pandas as pd
            df_arch = pd.DataFrame(arch_rows)
            st.dataframe(df_arch, use_container_width=True, height=300)

            # Evaluate on test set
            st.markdown("#### 🧪 Evaluasi pada Test Dataset")
            test_dir_path = DATA_DIR / "test"

            if not test_dir_path.exists():
                st.error("Folder test tidak ditemukan.")
            else:
                if st.button("▶️ Jalankan Evaluasi Test Dataset"):
                    with st.spinner("Mengevaluasi model pada test dataset..."):
                        try:
                            test_ds = tf.keras.preprocessing.image_dataset_from_directory(
                                str(test_dir_path),
                                label_mode="int",
                                image_size=IMG_SIZE,
                                batch_size=32,
                                shuffle=False,
                                seed=42
                            )
                            loss, acc = model.evaluate(test_ds, verbose=0)
                            preds_raw = model.predict(test_ds, verbose=0)
                            y_pred = (preds_raw > 0.5).astype(int).flatten()
                            y_true = np.concatenate([y for x, y in test_ds], axis=0)

                            from sklearn.metrics import classification_report, confusion_matrix

                            # Metrics besar
                            col_e1, col_e2, col_e3, col_e4 = st.columns(4)
                            with col_e1:
                                st.metric("🎯 Test Accuracy", f"{acc*100:.2f}%")
                            with col_e2:
                                st.metric("📉 Test Loss", f"{loss:.4f}")
                            with col_e3:
                                from sklearn.metrics import f1_score
                                f1 = f1_score(y_true, y_pred, average="macro")
                                st.metric("📊 F1-Score (Macro)", f"{f1:.4f}")
                            with col_e4:
                                from sklearn.metrics import accuracy_score
                                balanced = accuracy_score(y_true, y_pred)
                                st.metric("⚖️ Balanced Acc", f"{balanced*100:.2f}%")

                            # Classification Report
                            st.markdown("#### 📋 Classification Report")
                            report_dict = classification_report(
                                y_true, y_pred, target_names=CLASS_NAMES, output_dict=True
                            )
                            report_df = pd.DataFrame(report_dict).T.round(4)
                            st.dataframe(report_df.style.background_gradient(cmap="Blues"), use_container_width=True)

                            # Confusion Matrix
                            st.markdown("#### 🔢 Confusion Matrix")
                            cm = confusion_matrix(y_true, y_pred)
                            fig_cm, ax_cm = plt.subplots(figsize=(6, 5), facecolor="#0d1117")
                            ax_cm.set_facecolor("#0d1117")
                            sns.heatmap(
                                cm, annot=True, fmt="d", cmap="Blues",
                                xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES,
                                ax=ax_cm, linewidths=0.5,
                                annot_kws={"size": 18, "color": "white", "weight": "bold"}
                            )
                            ax_cm.set_title("Confusion Matrix", color="white", fontsize=14, fontweight="bold")
                            ax_cm.set_xlabel("Predicted Label", color="#aaa")
                            ax_cm.set_ylabel("True Label", color="#aaa")
                            ax_cm.tick_params(colors="white")
                            col_cm, _ = st.columns([1, 1])
                            with col_cm:
                                st.pyplot(fig_cm)
                            plt.close()

                            # Per-class detailed analysis
                            st.markdown("#### 🐱🐶 Analisis Per Kelas")
                            for i, cls in enumerate(CLASS_NAMES):
                                tp = cm[i][i]
                                fn = cm[i].sum() - tp
                                fp = cm[:, i].sum() - tp
                                tn = cm.sum() - tp - fn - fp
                                prec = report_dict[cls]["precision"]
                                rec  = report_dict[cls]["recall"]
                                f1c  = report_dict[cls]["f1-score"]
                                sup  = int(report_dict[cls]["support"])
                                emoji = "🐱" if cls == "Cat" else "🐶"
                                st.markdown(f"""
                                <div class="stat-card">
                                    <h4 style="color:#e94560;">{emoji} {cls}</h4>
                                    <div style="display:flex;gap:24px;flex-wrap:wrap;">
                                        <div><strong>Precision:</strong> {prec:.4f}</div>
                                        <div><strong>Recall:</strong> {rec:.4f}</div>
                                        <div><strong>F1-Score:</strong> {f1c:.4f}</div>
                                        <div><strong>Support:</strong> {sup:,} gambar</div>
                                    </div>
                                    <div style="margin-top:12px;color:#aaa;font-size:14px;">
                                        TP: {tp} &nbsp;|&nbsp; TN: {tn} &nbsp;|&nbsp;
                                        FP: {fp} &nbsp;|&nbsp; FN: {fn}
                                    </div>
                                </div>
                                """, unsafe_allow_html=True)

                        except Exception as e:
                            st.error(f"❌ Evaluasi gagal: {e}")

# ══════════════════════════════════════════════════════════════════
# HALAMAN 3 — ANALISIS DATASET PROJECT 1 (US ACCIDENTS)
# ══════════════════════════════════════════════════════════════════
if page == "🚦 Analisis US Accidents":
    st.title("🚦 Analisis Dataset Project 1 (US Accidents)")
    st.markdown("Visualisasi interaktif dataset berskala besar, menampilkan cuplikan **50,000 baris pertama** untuk analisis eksploratif.")
    st.markdown("---")

    @st.cache_data(show_spinner="Membaca dataset US Accidents (50k rows)...")
    def load_p1_data():
        p1_path = ROOT / "datasets" / "project1" / "US_Accidents_March23.csv"
        if not p1_path.exists():
            return None
        return pd.read_csv(p1_path, nrows=50000)

    df_p1 = load_p1_data()

    if df_p1 is None:
        st.error("❌ Dataset tidak ditemukan di `datasets/project1/US_Accidents_March23.csv`")
    else:
        st.subheader("📋 Cuplikan Data Awal")
        st.dataframe(df_p1.head(10), use_container_width=True)

        st.markdown("---")
        st.subheader("🕵️ 1. Penanganan Missing Values")
        
        # Hitung missing values sebelum penanganan
        missing_before = df_p1.isna().sum()
        missing_before = missing_before[missing_before > 0].sort_values(ascending=False)
        
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            st.markdown("**❌ Sebelum Penanganan (Top 10 Kolom Kosong):**")
            if not missing_before.empty:
                fig_miss, ax_miss = plt.subplots(figsize=(6, 4), facecolor="#0d1117")
                ax_miss.set_facecolor("#0d1117")
                sns.barplot(x=missing_before.head(10).values, y=missing_before.head(10).index, palette="magma", ax=ax_miss)
                ax_miss.tick_params(colors="white")
                ax_miss.spines["bottom"].set_color("white")
                ax_miss.spines["left"].set_color("white")
                ax_miss.set_xlabel("Jumlah Missing Value", color="white")
                st.pyplot(fig_miss)
                plt.close()
            else:
                st.success("Tidak ada missing value!")
                
        # Lakukan imputasi sederhana
        df_p1_clean = df_p1.copy()
        cols_to_drop = missing_before[missing_before > (len(df_p1)*0.5)].index
        df_p1_clean = df_p1_clean.drop(columns=cols_to_drop)
        
        num_cols = df_p1_clean.select_dtypes(include=np.number).columns
        for col in num_cols:
            if df_p1_clean[col].isna().sum() > 0:
                df_p1_clean[col].fillna(df_p1_clean[col].median(), inplace=True)
                
        cat_cols = df_p1_clean.select_dtypes(include=['object']).columns
        for col in cat_cols:
            if df_p1_clean[col].isna().sum() > 0:
                df_p1_clean[col].fillna(df_p1_clean[col].mode()[0], inplace=True)
                
        with col_m2:
            st.markdown("**✅ Sesudah Penanganan:**")
            st.success(f"✔️ **{len(cols_to_drop)} Kolom Dihapus** karena missing value > 50% `({', '.join(cols_to_drop)})`")
            st.info("✔️ **Kolom Numerik** (Suhu, Kelembaban, dll) diisi menggunakan nilai **Median** untuk menghindari efek outlier.")
            st.info("✔️ **Kolom Kategorikal** (Cuaca, Arah Angin) diisi menggunakan nilai **Modus (Mode)**.")
            
            missing_after = df_p1_clean.isna().sum().sum()
            st.metric("Total Missing Values Saat Ini", missing_after)

        st.markdown("---")
        st.subheader("📊 2. Distribusi Data & Outliers")
        
        col_d1, col_d2 = st.columns(2)
        with col_d1:
            st.markdown("**Distribusi Tingkat Keparahan Kecelakaan (Severity):**")
            fig_sev, ax_sev = plt.subplots(figsize=(5, 4), facecolor="#0d1117")
            ax_sev.set_facecolor("#0d1117")
            sns.countplot(x="Severity", data=df_p1_clean, palette="viridis", ax=ax_sev)
            ax_sev.tick_params(colors="white")
            ax_sev.set_xlabel("Severity (1 = Ringan, 4 = Parah)", color="white")
            ax_sev.set_ylabel("Jumlah Kecelakaan", color="white")
            st.pyplot(fig_sev)
            plt.close()
            
        with col_d2:
            st.markdown("**Deteksi Outlier pada Suhu (Temperature F):**")
            if "Temperature(F)" in df_p1_clean.columns:
                fig_out, ax_out = plt.subplots(figsize=(5, 4), facecolor="#0d1117")
                ax_out.set_facecolor("#0d1117")
                sns.boxplot(x=df_p1_clean["Temperature(F)"], color="#e94560", ax=ax_out)
                ax_out.tick_params(colors="white")
                ax_out.set_xlabel("Temperature(F)", color="white")
                st.pyplot(fig_out)
                plt.close()
            else:
                st.warning("Kolom Temperature(F) tidak tersedia.")

        st.markdown("---")
        st.subheader("⚙️ 3. Transformasi & Encoding")
        
        st.markdown("Proses ini akan mengubah fitur *datetime*, boolean, dan kategorikal menjadi format numerik numerik agar siap digunakan untuk *training* model.")
        
        col_t1, col_t2 = st.columns(2)
        
        # Proses Transformasi
        df_encoded = df_p1_clean.copy()
        
        # 1. Ekstraksi Datetime
        if "Start_Time" in df_encoded.columns:
            df_encoded['Start_Time'] = pd.to_datetime(df_encoded['Start_Time'], errors='coerce')
            df_encoded['Hour'] = df_encoded['Start_Time'].dt.hour
            df_encoded['DayOfWeek'] = df_encoded['Start_Time'].dt.dayofweek
            
        # 2. Boolean to Int
        bool_cols = df_encoded.select_dtypes(include=['bool']).columns
        if len(bool_cols) > 0:
            df_encoded[bool_cols] = df_encoded[bool_cols].astype(int)
            
        # 3. Label Encoding Sample
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        if "Weather_Condition" in df_encoded.columns:
            df_encoded['Weather_Condition_Encoded'] = le.fit_transform(df_encoded['Weather_Condition'].astype(str))
            
        with col_t1:
            st.markdown("**🔄 Ekstraksi Fitur Waktu:**")
            st.info("Kolom teks `Start_Time` diubah ke format Datetime lalu diekstrak menjadi kolom `Hour` dan `DayOfWeek`.")
            if "Hour" in df_encoded.columns:
                st.dataframe(df_encoded[['Start_Time', 'Hour', 'DayOfWeek']].head(6), use_container_width=True)
                
        with col_t2:
            st.markdown("**🔢 Encoding Kategori & Boolean:**")
            st.info("Kategori seperti `Weather_Condition` di-*Label Encode* dan nilai `True/False` diubah jadi `1/0`.")
            cols_to_show = []
            if "Weather_Condition_Encoded" in df_encoded.columns:
                cols_to_show.extend(['Weather_Condition', 'Weather_Condition_Encoded'])
            if len(bool_cols) > 0:
                cols_to_show.append(bool_cols[0]) # Tampilkan satu contoh kolom boolean
            
            if cols_to_show:
                st.dataframe(df_encoded[cols_to_show].head(6), use_container_width=True)

        st.markdown("---")
        st.subheader("🤖 4. Rekomendasi Model Prediksi")
        st.markdown("""
        Tujuan utama prediksi pada dataset ini adalah **klasifikasi multikelas variabel Severity**.
        Mengingat jumlah data jutaan baris (~3GB):

        1. 🥇 **XGBoost / LightGBM:** Pilihan paling ideal. Sangat ringan di memori, dapat mengeksekusi jutaan baris dengan cepat, mendukung parallel processing, dan secara otomatis menangani *missing values* yang tersisa.
        2. 🥈 **Random Forest:** Sangat robust terhadap outlier, namun butuh *resource* memori lebih besar dan waktu *training* yang lebih lama dibanding *boosting model*.
        3. 🥉 **Deep Learning (Tabular Neural Network):** Jika seluruh fitur sudah dinormalisasi dan di-*encode* sepenuhnya (one-hot/embedding), arsitektur Feed Forward simpel bisa digunakan.
        """)

        st.markdown("---")
        st.subheader("🧠 5. Simulasi Prediksi Severity (Machine Learning)")
        st.markdown("Mari kita melatih model **Random Forest Classifier** secara *real-time* menggunakan data bersih yang sudah diekstrak di atas (50.000 baris).")
        
        # Tombol untuk trigger proses
        if st.button("🚀 Mulai Proses Prediksi (Training & Evaluasi)", use_container_width=True):
            with st.spinner("⏳ Menyiapkan Data & Melatih Model Random Forest... (Estimasi 10-30 detik)"):
                from sklearn.ensemble import RandomForestClassifier
                from sklearn.model_selection import train_test_split
                from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
                
                # Daftar fitur utama yang diharapkan ada
                base_features = ['Temperature(F)', 'Humidity(%)', 'Pressure(in)', 'Visibility(mi)', 'Wind_Speed(mph)', 
                                 'Hour', 'DayOfWeek', 'Weather_Condition_Encoded']
                
                # Daftar fitur POI (yang berasal dari konversi boolean)
                # bool_cols sudah didefinisikan di proses transformasi sebelumnya
                poi_features = list(bool_cols) if 'bool_cols' in locals() else []
                
                # Gabungkan semua fitur potensial
                all_potential_features = base_features + poi_features
                
                # Filter hanya fitur yang benar-benar ada di dataframe setelah proses cleansing (drop missing)
                selected_features = [f for f in all_potential_features if f in df_encoded.columns]
                
                # Cek apakah kolom target 'Severity' ada
                if 'Severity' not in df_encoded.columns:
                    st.error("Kolom target 'Severity' tidak ditemukan dalam dataset!")
                else:
                    X = df_encoded[selected_features]
                    y = df_encoded['Severity']
                    
                    # Pastikan tidak ada sisa missing values (drop sisa baris yang masih mengandung NA untuk amannya)
                    X_y = pd.concat([X, y], axis=1).dropna()
                    X_clean = X_y[selected_features]
                    y_clean = X_y['Severity']
                    
                    # Split Train-Test (80% Train, 20% Test)
                    X_train, X_test, y_train, y_test = train_test_split(X_clean, y_clean, test_size=0.2, random_state=42, stratify=y_clean)
                    
                    # Training Model (batasi n_estimators agar cepat di Streamlit)
                    rf_model = RandomForestClassifier(n_estimators=50, max_depth=15, n_jobs=-1, random_state=42)
                    rf_model.fit(X_train, y_train)
                    
                    # Prediksi di Test set
                    y_pred = rf_model.predict(X_test)
                    acc = accuracy_score(y_test, y_pred)
                    
                    st.success("✅ Model Random Forest berhasil dilatih!")
                    
                    # --- MENAMPILKAN HASIL ---
                    st.markdown("#### 🏆 Hasil Evaluasi Model")
                    col_m1, col_m2 = st.columns(2)
                    with col_m1:
                        st.metric("🎯 Akurasi (Test Data)", f"{acc*100:.2f}%")
                        st.info(f"Model diuji menggunakan {len(X_test):,} baris data (*Test Set*).")
                    
                    with col_m2:
                        st.markdown("**🔍 Classification Report:**")
                        report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
                        # Buang row yang bukan per-kelas agar tabel rapi
                        df_report = pd.DataFrame(report_dict).T
                        df_report = df_report.drop(index=['accuracy', 'macro avg', 'weighted avg'], errors='ignore')
                        st.dataframe(df_report.style.background_gradient(cmap='Blues'), use_container_width=True)
                    
                    st.markdown("---")
                    
                    # Grafik Heatmap & Feature Importance
                    col_c1, col_c2 = st.columns(2)
                    with col_c1:
                        st.markdown("**🔢 Confusion Matrix**")
                        cm = confusion_matrix(y_test, y_pred)
                        fig_cm, ax_cm = plt.subplots(figsize=(6, 5), facecolor="#0d1117")
                        ax_cm.set_facecolor("#0d1117")
                        sns.heatmap(cm, annot=True, fmt='d', cmap='magma', ax=ax_cm, 
                                    annot_kws={"size": 12, "color": "white"})
                        ax_cm.set_xlabel("Prediksi Model (Severity)", color="#aaa")
                        ax_cm.set_ylabel("Data Asli (Severity)", color="#aaa")
                        ax_cm.tick_params(colors="white")
                        st.pyplot(fig_cm)
                        plt.close()
                        
                    with col_c2:
                        st.markdown("**🌟 Feature Importance (Top 10)**")
                        importances = rf_model.feature_importances_
                        indices = np.argsort(importances)[::-1][:10]
                        top_features = [selected_features[i] for i in indices]
                        top_importances = importances[indices]
                        
                        fig_fi, ax_fi = plt.subplots(figsize=(6, 5), facecolor="#0d1117")
                        ax_fi.set_facecolor("#0d1117")
                        sns.barplot(x=top_importances, y=top_features, palette='viridis', ax=ax_fi)
                        ax_fi.set_xlabel("Tingkat Kepentingan", color="#aaa")
                        ax_fi.set_ylabel("")
                        ax_fi.tick_params(colors="white")
                        st.pyplot(fig_fi)
                        plt.close()
