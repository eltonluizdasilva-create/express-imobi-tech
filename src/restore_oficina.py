import sys

source_path = r"C:\Users\Elton\Desktop\top\files (10)\Admin.jsx"
target_path = r"c:\Users\Elton\Desktop\oficina-ia-master\src\Admin.jsx"

with open(source_path, 'r', encoding='utf-8') as f:
    source_lines = f.readlines()
    
# Get lines 4771 to 5227 (indices 4770 to 5227 since 5227 is exclusive in slice)
snippet = source_lines[4770:5227]

with open(target_path, 'r', encoding='utf-8') as f:
    target_lines = f.readlines()

# Ensure we are replacing the correct lines. 4363 to 4385 is index 4362 to 4385
print("Replacing block starting with:")
print(target_lines[4362].strip())
print("Ending with:")
print(target_lines[4384].strip())

new_lines = target_lines[:4362] + snippet + target_lines[4385:]

with open(target_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done.")
