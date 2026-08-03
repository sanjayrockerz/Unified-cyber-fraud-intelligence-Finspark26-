import os

api_dir = r"C:\Users\motis\Downloads\fastapi\Unified-Cyber-Fraud-Intelligence-Platform\api"

for root, dirs, files in os.walk(api_dir):
    for file in files:
        if file.endswith(".py"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = content.replace("api.core_platform", "api.core_platform")
            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

# Rename the directory
os.rename(os.path.join(api_dir, "platform"), os.path.join(api_dir, "core_platform"))
print("Renamed platform to core_platform")
