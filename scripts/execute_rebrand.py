import os
import glob

root_dir = r"c:\Users\motis\Downloads\fastapi\Unified-Cyber-Fraud-Intelligence-Platform"

skip_dirs = {".git", ".pytest_cache", "node_modules", "venv", ".idea", ".vscode", "brain", ".gemini"}
valid_extensions = {".py", ".jsx", ".js", ".json", ".html", ".css", ".md", ".kt", ".xml", ".gradle", ".properties", ".txt", ".yml", ".yaml"}

rebrand_map = {
    "Fuzen AI": "Fuzen AI",
    "FuzenAI": "FuzenAI",
    "FUZEN AI": "FUZEN AI",
    "Fuzen AI": "Fuzen AI",
    "Fuzen AI Copilot": "Fuzen AI Copilot",
    "Fuzen AI Copilot": "Fuzen AI Copilot",
    "Fuzen AI Bank": "Fuzen AI Bank",
    "FuzenAIBank": "FuzenAIBank",
    "FUZEN_AI_BANK": "FUZEN_AI_BANK",
    "fuzen-ai-bank": "fuzen-ai-bank",
    "fuzenbank": "fuzenbank",
}

modified_files = []

for dirpath, dirnames, filenames in os.walk(root_dir):
    # Filter out skipped directories
    dirnames[:] = [d for d in dirnames if d not in skip_dirs and not d.startswith(".")]
    
    for filename in filenames:
        ext = os.path.splitext(filename)[1].lower()
        if ext not in valid_extensions and filename not in {"Dockerfile", "Makefile", "README", "LICENSE"}:
            continue
            
        filepath = os.path.join(dirpath, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = content
            for old_str, new_str in rebrand_map.items():
                new_content = new_content.replace(old_str, new_str)
                
            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                modified_files.append(os.path.relpath(filepath, root_dir))
        except Exception:
            pass

print(f"Phase 1 Rebranding Complete! Updated {len(modified_files)} files across the workspace.")
for f in modified_files[:20]:
    print(f" - {f}")
if len(modified_files) > 20:
    print(f" ... and {len(modified_files) - 20} more files.")
