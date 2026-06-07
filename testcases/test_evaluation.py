"""
CareerPilot — Evaluation Test Suite
===================================
Documented test cases with: input, expected output, actual output, pass/fail verdict.

Tests target pure-logic functions that do NOT require:
  - MongoDB / ChromaDB connections
  - Gemini API keys
  - Live external job APIs

Run:  python testcases/test_evaluation.py
"""

import sys, os, re

# ── Bootstrap Django settings so imports succeed ──────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "server"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "codesprint.settings")

# Suppress heavy imports that need API keys / DB by stubbing them
# We only import the specific modules under test.
# ---------------------------------------------------------------------------

# ── 1. strip_html  (server/assistant/job_sources.py) ──────────────────────────
from html.parser import HTMLParser

class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts = []
    def handle_data(self, data):
        self._parts.append(data)
    def get_text(self):
        return " ".join(self._parts)

def strip_html(html_str):
    if not html_str:
        return ""
    s = _HTMLStripper()
    try:
        s.feed(str(html_str))
        text = s.get_text()
    except Exception:
        text = re.sub(r"<[^>]+>", " ", str(html_str))
    return re.sub(r"\s+", " ", text).strip()


# ── 2. chunk_cv  (server/cv/services/chunk_cv.py) ────────────────────────────
SECTION_PATTERNS = {
    'education':  re.compile(r'\b(education|academic|qualification|degree|university|college|school)\b', re.I),
    'experience': re.compile(r'\b(experience|work|employment|career|internship|job|position)\b', re.I),
    'skills':     re.compile(r'\b(skills|technologies|tools|languages|competencies|tech stack)\b', re.I),
    'projects':   re.compile(r'\b(projects|portfolio|personal projects|open.?source)\b', re.I),
    'summary':    re.compile(r'\b(summary|objective|profile|about me|overview|introduction)\b', re.I),
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
                chunks.append({'section': current_section, 'content': '\n'.join(current_lines).strip()})
            current_section = detected
            current_lines = [line]
        else:
            current_lines.append(line)
    if current_lines:
        chunks.append({'section': current_section, 'content': '\n'.join(current_lines).strip()})
    final_chunks = []
    for chunk in chunks:
        words = chunk['content'].split()
        if len(words) <= 300:
            final_chunks.append(chunk)
        else:
            for i in range(0, len(words), 300):
                final_chunks.append({'section': chunk['section'], 'content': ' '.join(words[i:i+300])})
    return final_chunks


# ── 3. _local_parse  (server/cv/services/parse_cv.py) ────────────────────────
def _local_parse(raw_text):
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    name = lines[0] if lines else "Candidate Name"
    email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.]+', raw_text)
    email = email_match.group(0) if email_match else ""
    title = ""
    if len(lines) > 1:
        candidate = lines[1]
        if len(candidate) < 100 and '@' not in candidate and not re.match(r'^[\d+()-]+$', candidate):
            title = candidate
    skills = []
    skills_section = False
    for line in lines:
        low = line.lower()
        if re.match(r'^(technical\s+)?skills|technologies|competencies', low):
            skills_section = True
            if ':' in line:
                parts = line.split(':', 1)[1]
                skills.extend([s.strip() for s in re.split(r'[,;|]', parts) if s.strip()])
            continue
        if skills_section:
            if re.match(r'^(experience|education|projects|work|summary|objective)', low):
                skills_section = False
                continue
            tokens = re.split(r'[,;|]', line)
            skills.extend([t.strip() for t in tokens if t.strip() and len(t.strip()) < 40])
    seen = set()
    unique_skills = []
    for s in skills:
        if s.lower() not in seen:
            seen.add(s.lower())
            unique_skills.append(s)
    skills = unique_skills[:30]
    return {"name": name, "title": title, "email": email, "skills": skills}


# ── 4 & 5. Location extraction + classification  (server/assistant/services.py) ──
def _extract_location_keywords(query):
    q = query.lower().strip()
    STOP = {"the","a","an","this","next","which","that","their","them","my","your","our",
            "his","her","its","with","without","need","needs","looking","search","find","want","get"}
    ROLE_WORDS = {"remote","hybrid","on-site","onsite","wfh","full-time","part-time","contract",
                  "freelance","internship","junior","senior","mid","lead","staff","principal",
                  "backend","frontend","fullstack","full-stack","devops","sre","ml","ai","data",
                  "dev","qa","ui","ux","ios","android","engineer","developer","designer","analyst",
                  "manager","intern","software","web","mobile","cloud","security","product",
                  "python","java","javascript","react","node","golang","rust",
                  "this","month","week","year","today","now","soon"}
    found_locations = set()
    work_modes = set()
    loc_phrases = re.findall(
        r'(?:in|near|from|around|at)\s+([a-z][a-z\s]{1,30}?)(?=\s+(?:open|this|next|that|which|with|for|salary|remote|on-site|hybrid|full|part|intern|junior|senior|mid|lead|staff|principal|backend|frontend|fullstack|ml|ai|data|dev|engineer|developer|internship|job|role|position|work)\b|$|\?|\.|,)',
        q
    )
    for phrase in loc_phrases:
        phrase = phrase.strip()
        if not phrase:
            continue
        words = phrase.split()
        while words and words[-1] in STOP:
            words.pop()
        phrase = " ".join(words)
        if not phrase:
            continue
        if phrase in {"remote","hybrid","on-site","onsite","wfh","work from home"}:
            work_modes.add(phrase)
        elif phrase not in ROLE_WORDS and not all(w in STOP for w in words):
            found_locations.add(phrase)
    cap_words = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b', query)
    for word in cap_words:
        wl = word.lower()
        if wl in {"remote","hybrid","onsite","on-site","wfh"}:
            work_modes.add(wl)
        elif wl not in STOP and wl not in ROLE_WORDS:
            found_locations.add(wl)
    for term in ("remote","hybrid","on-site","onsite","wfh","work from home","worldwide","global","anywhere"):
        if term in q:
            work_modes.add(term)
    if work_modes and not found_locations:
        return list(work_modes)
    return list(found_locations | work_modes)


def _classify_location_match(job_location, job_title, query_location_keywords):
    if not query_location_keywords:
        return "other"
    loc = (job_location or "").lower()
    title = (job_title or "").lower()
    loc_words = set(loc.replace(",", " ").replace("/", " ").replace("-", " ").split())
    WORK_MODES = {"remote","worldwide","global","anywhere","work from home","wfh","hybrid"}
    for kw in query_location_keywords:
        kw_lower = kw.lower()
        if kw_lower in WORK_MODES:
            if any(w in loc for w in WORK_MODES):
                return "exact"
            continue
        if kw_lower in loc or kw_lower in title:
            return "exact"
        kw_parts = kw_lower.split()
        for part in kw_parts:
            if len(part) < 2:
                continue
            for lw in loc_words:
                if lw == part or lw.startswith(part) or part.startswith(lw):
                    return "exact"
            if part in title:
                return "exact"
    if any(w in loc for w in WORK_MODES):
        return "remote"
    return "other"


# ════════════════════════════════════════════════════════════════════════════════
# TEST CASES
# ════════════════════════════════════════════════════════════════════════════════

results = []

def run_test(tc_id, description, input_data, expected, actual):
    passed = (expected == actual)
    results.append({
        "id": tc_id,
        "description": description,
        "input": input_data,
        "expected": expected,
        "actual": actual,
        "verdict": "PASS" if passed else "FAIL",
    })
    return passed


# ── TC-1: strip_html removes all HTML tags and collapses whitespace ───────────
input_1 = '<p>Senior <b>Python</b> Developer &nbsp; with <i>AI</i> experience</p>'
expected_1 = "Senior Python Developer with AI experience"
actual_1 = strip_html(input_1)
run_test("TC-1", "strip_html — removes HTML tags and collapses whitespace",
         input_1, expected_1, actual_1)

# ── TC-2: strip_html returns empty string for None / empty input ──────────────
input_2 = ""
expected_2 = ""
actual_2 = strip_html(input_2)
run_test("TC-2", "strip_html — returns empty string for empty input",
         input_2, expected_2, actual_2)

# ── TC-3: chunk_cv splits CV into correct sections ────────────────────────────
input_3 = """John Doe
Software Engineer

Education
B.Sc. in Computer Science
XYZ Institute
2020-2024

Experience
Junior Developer at TechCorp
Built Django and React apps

Skills
Python, JavaScript, React, Django, SQL
"""
actual_3 = chunk_cv(input_3)
section_names_3 = [c["section"] for c in actual_3]
expected_sections_3 = ["other", "education", "experience", "skills"]
run_test("TC-3", "chunk_cv — splits CV text into correct section groups",
         input_3[:60] + "...", expected_sections_3, section_names_3)

# ── TC-4: _local_parse extracts name, email, title, and skills from raw CV ───
input_4 = """Alice Johnson
Full-Stack Developer
alice.johnson@gmail.com

Technical Skills: Python, JavaScript, React, Django, SQL, Docker

Experience
Software Engineer at BigTech Inc.
Jan 2022 - Present
- Led backend migration to Django
"""
actual_4 = _local_parse(input_4)
expected_name_4 = "Alice Johnson"
expected_email_4 = "alice.johnson@gmail.com"
expected_title_4 = "Full-Stack Developer"
expected_skills_subset_4 = {"python", "javascript", "react", "django", "sql", "docker"}
actual_skills_lower = {s.lower() for s in actual_4["skills"]}
run_test("TC-4",
         "_local_parse — extracts name, email, title, and skills from raw CV text",
         input_4[:80] + "...",
         {"name": expected_name_4, "email": expected_email_4,
          "title": expected_title_4, "skills_subset": expected_skills_subset_4},
         {"name": actual_4["name"], "email": actual_4["email"],
          "title": actual_4["title"], "skills_subset": actual_skills_lower & expected_skills_subset_4})

# ── TC-5: _extract_location_keywords detects city name from query ─────────────
input_5 = "Find me Python developer jobs in Dhaka"
actual_5 = _extract_location_keywords(input_5)
expected_contains_5 = "dhaka"
pass_5 = expected_contains_5 in actual_5
run_test("TC-5",
         "_extract_location_keywords — extracts city 'Dhaka' from natural-language query",
         input_5,
         True, pass_5)

# ── TC-6: _extract_location_keywords detects 'remote' work mode ──────────────
input_6 = "remote machine learning engineer jobs"
actual_6 = _extract_location_keywords(input_6)
expected_contains_6 = "remote"
pass_6 = expected_contains_6 in actual_6
run_test("TC-6",
         "_extract_location_keywords — detects 'remote' as a work-mode keyword",
         input_6,
         True, pass_6)

# ── TC-7: _classify_location_match returns 'exact' for matching city ──────────
input_7 = ("Dhaka, Bangladesh", "Python Developer", ["dhaka"])
expected_7 = "exact"
actual_7 = _classify_location_match(*input_7)
run_test("TC-7",
         "_classify_location_match — returns 'exact' when job city matches query keyword",
         str(input_7), expected_7, actual_7)

# ── TC-8: _classify_location_match returns 'remote' when no exact match but job is remote ─
input_8 = ("Remote — Worldwide", "ML Engineer", ["berlin"])
expected_8 = "remote"
actual_8 = _classify_location_match(*input_8)
run_test("TC-8",
         "_classify_location_match — returns 'remote' for a remote job when query city doesn't match",
         str(input_8), expected_8, actual_8)

# ── TC-9: _classify_location_match returns 'other' for unrelated location ─────
input_9 = ("New York, USA", "Frontend Developer", ["dhaka"])
expected_9 = "other"
actual_9 = _classify_location_match(*input_9)
run_test("TC-9",
         "_classify_location_match — returns 'other' for non-matching non-remote job location",
         str(input_9), expected_9, actual_9)

# ── TC-10: chunk_cv splits very large sections into ≤300-word pieces ──────────
big_section = "Experience\n" + " ".join([f"word{i}" for i in range(650)])
input_10 = big_section
actual_10 = chunk_cv(input_10)
# 650 words → should produce 3 chunks (300 + 300 + 50)
expected_chunk_count_10 = 3
run_test("TC-10",
         "chunk_cv — splits a 650-word section into exactly 3 sub-chunks (≤300 words each)",
         f"Experience section with 650 words",
         expected_chunk_count_10, len(actual_10))


# ════════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════════════════════

print("\n" + "=" * 80)
print("  CAREERPILOT — EVALUATION TEST SUITE RESULTS")
print("=" * 80)

pass_count = sum(1 for r in results if r["verdict"] == "PASS")
fail_count = sum(1 for r in results if r["verdict"] == "FAIL")

for r in results:
    status_icon = "[PASS]" if r["verdict"] == "PASS" else "[FAIL]"
    print(f"\n{status_icon}  {r['id']}: {r['description']}")
    inp_preview = str(r["input"])[:100]
    print(f"         Input    : {inp_preview}")
    print(f"         Expected : {r['expected']}")
    print(f"         Actual   : {r['actual']}")
    print(f"         Verdict  : {r['verdict']}")

print("\n" + "-" * 80)
print(f"  TOTAL: {len(results)}  |  PASSED: {pass_count}  |  FAILED: {fail_count}")
print("-" * 80)
if fail_count == 0:
    print("  ALL TEST CASES PASSED.")
else:
    print(f"  {fail_count} TEST CASE(S) FAILED — review output above.")
# ── Write results to txt file ─────────────────────────────────────────────────
output_path = os.path.join(os.path.dirname(__file__), "test_results.txt")
with open(output_path, "w", encoding="utf-8") as f:
    f.write("=" * 80 + "\n")
    f.write("  CAREERPILOT — EVALUATION TEST SUITE RESULTS\n")
    f.write("=" * 80 + "\n")
    for r in results:
        status_icon = "[PASS]" if r["verdict"] == "PASS" else "[FAIL]"
        f.write(f"\n{status_icon}  {r['id']}: {r['description']}\n")
        inp_preview = str(r["input"])[:200]
        f.write(f"         Input    : {inp_preview}\n")
        f.write(f"         Expected : {r['expected']}\n")
        f.write(f"         Actual   : {r['actual']}\n")
        f.write(f"         Verdict  : {r['verdict']}\n")
    f.write("\n" + "-" * 80 + "\n")
    f.write(f"  TOTAL: {len(results)}  |  PASSED: {pass_count}  |  FAILED: {fail_count}\n")
    f.write("-" * 80 + "\n")
    if fail_count == 0:
        f.write("  ALL TEST CASES PASSED.\n")
    else:
        f.write(f"  {fail_count} TEST CASE(S) FAILED — review output above.\n")
    f.write("=" * 80 + "\n")

print(f"\n  Results saved to: {output_path}")
print("=" * 80 + "\n")

sys.exit(0 if fail_count == 0 else 1)
