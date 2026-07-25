import os

src_dir = r"C:\Users\motis\Downloads\fastapi\Unified-Cyber-Fraud-Intelligence-Platform\web\src"
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".jsx") or file.endswith(".js"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            if "http://localhost:8001" in content or "http://10.0.2.2:8001" in content:
                new_content = content.replace("http://localhost:8001", "http://localhost:8000")
                new_content = new_content.replace("http://10.0.2.2:8001", "http://10.0.2.2:8000")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
