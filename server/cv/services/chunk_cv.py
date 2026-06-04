import re

SECTION_PATTERNS = {
    'education':   re.compile(r'\b(education|academic|qualification|degree|university|college|school)\b', re.I),
    'experience':  re.compile(r'\b(experience|work|employment|career|internship|job|position)\b', re.I),
    'skills':      re.compile(r'\b(skills|technologies|tools|languages|competencies|tech stack)\b', re.I),
    'projects':    re.compile(r'\b(projects|portfolio|personal projects|open.?source)\b', re.I),
    'summary':     re.compile(r'\b(summary|objective|profile|about me|overview|introduction)\b', re.I),
}

def detect_section(line):
    for section, pattern in SECTION_PATTERNS.items():
        if pattern.search(line):
            return section
    return None

def chunk_cv(raw_text):
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    chunks = []
    current_section = 'other'
    current_lines = []

    for line in lines:
        detected = detect_section(line)
        if detected:
            if current_lines:
                chunks.append({
                    'section': current_section,
                    'content': '\n'.join(current_lines).strip()
                })
            current_section = detected
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_lines:
        chunks.append({
            'section': current_section,
            'content': '\n'.join(current_lines).strip()
        })

    # Split large chunks into ~300 word pieces
    final_chunks = []
    for chunk in chunks:
        words = chunk['content'].split()
        if len(words) <= 300:
            final_chunks.append(chunk)
        else:
            for i in range(0, len(words), 300):
                final_chunks.append({
                    'section': chunk['section'],
                    'content': ' '.join(words[i:i+300])
                })

    return final_chunks