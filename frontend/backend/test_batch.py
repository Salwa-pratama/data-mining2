import requests
import json
import csv

batch = []
with open('../data-tes/us-accident-test-data.csv', 'r') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if i >= 10: break
        if 'Severity_Asli' in row:
            del row['Severity_Asli']
        for k, v in row.items():
            if v == 'True': row[k] = True
            elif v == 'False': row[k] = False
            else:
                try: row[k] = float(v)
                except: row[k] = 0.0
        batch.append(row)

url = "http://127.0.0.1:8000/api/predict/batch"

res_unscaled = requests.post(url, json={"batch": batch, "is_scaled": False}).json()
print("UNSCALED (False):", [r['severity'] for r in res_unscaled.get('results', [])])

res_scaled = requests.post(url, json={"batch": batch, "is_scaled": True}).json()
print("SCALED (True):", [r['severity'] for r in res_scaled.get('results', [])])

print("RAW CONFIDENCE (Unscaled):", [round(r['confidence'], 4) for r in res_unscaled.get('results', [])])
print("RAW CONFIDENCE (Scaled):", [round(r['confidence'], 4) for r in res_scaled.get('results', [])])
