import json

with open('syntax/project1.ipynb', 'r') as f:
    nb = json.load(f)

new_source = [
    "import pandas as pd\n",
    "import numpy as np\n",
    "\n",
    "# 1. Load seluruh dataset (~7.7 juta baris)\n",
    "print('Loading seluruh dataset (proses ini mungkin memakan waktu)...')\n",
    "df = pd.read_csv('../datasets/project1/US_Accidents_March23.csv')\n",
    "print('Total data mentah:', df.shape)\n",
    "print('Distribusi awal:\\n', df['Severity'].value_counts())\n",
    "\n",
    "# 2. Penyeimbangan Data (Undersampling Class 2)\n",
    "# Pisahkan class 2 dan class lainnya\n",
    "df_minority = df[df['Severity'] != 2]\n",
    "df_majority = df[df['Severity'] == 2]\n",
    "\n",
    "# Potong class 2 agar jumlahnya setara dengan GABUNGAN class 1, 3, dan 4\n",
    "jumlah_minority = len(df_minority)\n",
    "df_majority_downsampled = df_majority.sample(n=jumlah_minority, random_state=42)\n",
    "\n",
    "# Gabungkan dan acak ulang susunan barisnya\n",
    "df = pd.concat([df_majority_downsampled, df_minority]).sample(frac=1, random_state=42).reset_index(drop=True)\n",
    "\n",
    "print('\\nTotal data setelah diseimbangkan:', df.shape)\n",
    "print('Distribusi baru:\\n', df['Severity'].value_counts())\n"
]

for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code' and 'US_Accidents_March23.csv' in "".join(cell['source']) and 'skiprows' in "".join(cell['source']):
        nb['cells'][i]['source'] = new_source
        break

with open('syntax/project1_balanced.ipynb', 'w') as f:
    json.dump(nb, f, indent=1)

print("Notebook berhasil disalin dan dimodifikasi menjadi project1_balanced.ipynb")
