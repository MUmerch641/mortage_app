import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # In incomeDetailScreen.tsx
    # Fix `TextInput \n         placeholder="0"\n        >` to `TextInput>`
    content = re.sub(r'TextInput\s*\n\s*placeholder="0"\s*\n\s*>', 'TextInput>', content)
    
    # Fix `TextInputFocusEventData \n         placeholder="0"\n        >` to `TextInputFocusEventData>`
    content = re.sub(r'TextInputFocusEventData\s*\n\s*placeholder="0"\s*\n\s*>', 'TextInputFocusEventData>', content)
    
    # Fix `e = \n         placeholder="0"\n        >` to `e =>`
    content = re.sub(r'=\s*\n\s*placeholder="0"\s*\n\s*>', '=>', content)
    
    # And there might be `TextInput | null \n         placeholder="0"\n        >`
    content = re.sub(r'TextInput \| null\s*\n\s*placeholder="0"\s*\n\s*>', 'TextInput | null>', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('src/screens'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

