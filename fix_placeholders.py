import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If the file is TextInpurField.tsx, just fix the placeholderTextColor
    if 'TextInpurField.tsx' in filepath:
        content = re.sub(r'placeholderTextColor=\{placeholderColor \|\| [^}]+\}', r'placeholderTextColor={placeholderColor || "#999"}', content)
    else:
        # For all other files, we add placeholderTextColor="#999" if it doesn't exist
        # And if it's incomeDetailScreen.tsx, we also add placeholder="0" if placeholder is missing
        
        # Split by <TextInput to process each tag
        parts = content.split('<TextInput')
        new_parts = [parts[0]]
        
        for part in parts[1:]:
            # The part contains everything after <TextInput up to the next <TextInput
            # Let's find the closing > or />
            # Wait, regex is safer for this.
            pass
            
    with open(filepath, 'w') as f:
        f.write(content)

