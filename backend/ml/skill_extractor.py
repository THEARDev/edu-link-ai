"""
Skill Extractor — Resume se skills nikaalo
"""

import re

from ml.skills_dict import SKILLS_DICT


def extract_text_from_pdf(pdf_path):
    """PDF se text nikalo"""
    try:
        import pdfplumber
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except Exception as e:
        print(f"PDF error: {e}")
        return ""


def extract_skills(text):
    """Text se skills nikalo"""
    if not text:
        return []

    text_lower = text.lower()
    found = {}

    for keyword, display_name in SKILLS_DICT.items():
        if len(keyword) <= 3:
            pattern = r'\b' + re.escape(keyword) + r'\b'
        else:
            pattern = re.escape(keyword)

        if re.search(pattern, text_lower):
            if display_name not in found:
                found[display_name] = {
                    "name": display_name,
                    "level": "intermediate",
                    "source": "resume"
                }

    return list(found.values())


def parse_resume(pdf_path):
    """PDF parse karo → skills nikalo"""
    text = extract_text_from_pdf(pdf_path)
    skills = extract_skills(text)

    return {
        "text_length": len(text),
        "skills": skills,
        "total_skills": len(skills)
    }