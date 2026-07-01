import json

with open('syntax/project1_balanced.ipynb', 'r') as f:
    nb = json.load(f)

for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code':
        source = cell['source']
        new_source = []
        is_pca_cell = any("=== TAHAP 2: PRINCIPAL COMPONENT ANALYSIS" in line for line in source)
        
        for line in source:
            # Comment out PCA entirely because SVD on 6M rows will crash RAM
            if is_pca_cell:
                if not line.startswith('#'):
                    line = '# ' + line
            
            # Comment out sns and plt lines
            elif ('sns.heatmap' in line or 'plt.title(' in line or 
                  'plt.xlabel(' in line or 'plt.ylabel(' in line or 
                  'plt.show(' in line or 'sns.barplot(' in line or 
                  'plt.figure(' in line or 'sns.boxplot(' in line):
                if not line.startswith('#'):
                    line = '# ' + line
            
            new_source.append(line)
        
        nb['cells'][i]['source'] = new_source

with open('syntax/project1_balanced.ipynb', 'w') as f:
    json.dump(nb, f, indent=1)

print("Berhasil meng-comment output/visualisasi yang berat!")
