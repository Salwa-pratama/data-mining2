import json

def run_notebook(notebook_path):
    with open(notebook_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    code_cells = [cell for cell in nb['cells'] if cell['cell_type'] == 'code']
    
    code = "display = print\n"
    for cell in code_cells:
        # Avoid running things like pip install or shell commands if present
        source = "".join(cell['source'])
        if source.strip().startswith('!'): continue
        
        # also skip magics
        lines = source.split('\n')
        lines = [l for l in lines if not l.strip().startswith('%')]
        code += '\n'.join(lines) + '\n\n'
        
    print("Executing notebook code...")
    exec(code, globals())

if __name__ == "__main__":
    run_notebook("project1 copy.ipynb")
