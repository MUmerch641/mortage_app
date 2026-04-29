import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # fix `el = \n        > {` to `el => {`
    content = content.replace("= \n        > {", "=> {")
    content = content.replace("= \n        >", "=>")
    
    # fix `TextInput | null \n        >` to `TextInput | null>`
    content = content.replace("TextInput | null \n        >", "TextInput | null>")
    
    # fix `TextInputFocusEventData \n        >` to `TextInputFocusEventData>`
    content = content.replace("TextInputFocusEventData \n        >", "TextInputFocusEventData>")
    
    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('src/screens'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

