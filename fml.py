import sys
import re
import json

def extract_middle_parts(filepath):
    pattern = re.compile(r"monaco-vscode-([^-]+)-service-override")
    results = []
    with open(filepath, 'r') as file:
        for line in file:
            match = pattern.search(line)
            if match:
                results.append(match.group(1))
    print(json.dumps(results))

extract_middle_parts(sys.argv[1])
