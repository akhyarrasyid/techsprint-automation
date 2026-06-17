import os
import sys
import subprocess

def install_and_import(package):
    try:
        __import__(package)
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def extract_pdf_text():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pdf_path = os.path.join(base_dir, "dataset", "Case Study - Data Automation competition.pdf")
    output_txt_path = os.path.join(base_dir, "data", "knowledge", "case_study.txt")
    
    if not os.path.exists(pdf_path):
        print(f"PDF file not found at {pdf_path}")
        return
        
    install_and_import("pypdf")
    import pypdf
    
    print(f"Extracting text from {pdf_path}...")
    reader = pypdf.PdfReader(pdf_path)
    text = []
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text()
        text.append(f"--- PAGE {i+1} ---\n{page_text}")
        
    full_text = "\n\n".join(text)
    
    # Create dir if not exists
    os.makedirs(os.path.dirname(output_txt_path), exist_ok=True)
    with open(output_txt_path, "w", encoding="utf-8") as f:
        f.write(full_text)
        
    print(f"Successfully extracted {len(full_text)} characters and wrote to {output_txt_path}")

if __name__ == "__main__":
    extract_pdf_text()
