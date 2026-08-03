import os
import glob

web_src = r"C:\Users\motis\Downloads\fastapi\Unified-Cyber-Fraud-Intelligence-Platform\web\src"
files = glob.glob(os.path.join(web_src, "**", "*.*"), recursive=True)

fixed_count = 0
for filepath in files:
    if not os.path.isfile(filepath):
        continue
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        new_content = content
        # Fix corrupted UTF-8 string artifacts
        new_content = new_content.replace("â€”", "—")
        new_content = new_content.replace("âœ•", "✕")
        new_content = new_content.replace("âœ“", "✓")
        new_content = new_content.replace("âš ", "⚠️")
        new_content = new_content.replace("â‚¹", "₹")
        
        if new_content != content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            fixed_count += 1
            print(f"Fixed encoding artifact in: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print(f"Done! Cleaned encoding artifacts in {fixed_count} frontend source files.")
