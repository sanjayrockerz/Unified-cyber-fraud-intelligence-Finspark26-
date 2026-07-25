import os

android_dir = r"c:\Users\motis\Downloads\fastapi\Unified-Cyber-Fraud-Intelligence-Platform\fusion-reference-bank\app\src"

modified = 0
for root, dirs, files in os.walk(android_dir):
    for filename in files:
        if filename.endswith(".kt") or filename.endswith(".java") or filename.endswith(".xml"):
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content.replace("com.fuzenbank.mobileapp", "com.fusionbank.mobileapp")
                new_content = new_content.replace("com.fuzenbank", "com.fusionbank")
                
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    modified += 1
            except Exception as e:
                print(f"Error {filepath}: {e}")

print(f"Done! Reverted package declarations in {modified} Android source files to com.fusionbank.mobileapp.")
