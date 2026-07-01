import json

with open('syntax/project1_balanced.ipynb', 'r') as f:
    nb = json.load(f)

# Find the index of the load data cell
cell_idx = -1
for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code' and 'Penyeimbangan Data (Undersampling' in "".join(cell['source']):
        cell_idx = i
        break

if cell_idx != -1:
    markdown_cell = {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "### ⚖️ TAHAP 1.5: PENYEIMBANGAN DATA (UNDERSAMPLING)\n",
            "\n",
            "Dataset kecelakaan ini sangat *imbalanced* (tidak seimbang). Lebih dari **90% data berada di Severity Level 2**.\n",
            "Jika model XGBoost dilatih dengan data seperti ini, model akan malas belajar dan hanya menebak `Level 2` ke semua input yang masuk.\n",
            "\n",
            "Oleh karena itu, sel kode di bawah ini melakukan proses **Undersampling**:\n",
            "1. Membaca **seluruh dataset (~7.7 juta baris)**.\n",
            "2. Memisahkan kelas mayoritas (Severity 2) dari kelas minoritas (Severity 1, 3, dan 4).\n",
            "3. Memotong (secara acak) jumlah data Severity 2 agar **jumlahnya sama persis** dengan *total gabungan* Severity 1, 3, dan 4.\n",
            "4. Mencetak hasil distribusi sebelum dan sesudah dipotong."
        ]
    }
    
    # Insert markdown right before the code cell
    nb['cells'].insert(cell_idx, markdown_cell)
    
    with open('syntax/project1_balanced.ipynb', 'w') as f:
        json.dump(nb, f, indent=1)
    print("Berhasil menambahkan cell Markdown.")
else:
    print("Gagal menemukan cell.")
