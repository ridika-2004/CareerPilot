"""
Real job data sources — fetches live job listings from free public APIs.
"""
import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser


class _HTMLStripper(HTMLParser):
    """Strip HTML tags, keep text content."""
    def __init__(self):
        super().__init__()
        self._parts = []

    def handle_data(self, data):
        self._parts.append(data)

    def get_text(self):
        return " ".join(self._parts)


def strip_html(html_str):
    """Remove HTML tags from a string, return plain text."""
    if not html_str:
        return ""
    s = _HTMLStripper()
    try:
        s.feed(str(html_str))
        text = s.get_text()
    except Exception:
        text = re.sub(r"<[^>]+>", " ", str(html_str))
    # Collapse whitespace
    return re.sub(r"\s+", " ", text).strip()


# ── Remotive ────────────────────────────────────────────────────────

def fetch_remotive_jobs(query, limit=25):
    """
    Fetch remote jobs from Remotive API.
    Returns list of dicts: {title, company, location, description, url, tags, salary, source}
    """
    try:
        url = "https://remotive.com/api/remote-jobs"
        params = {"search": query, "limit": limit}
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        raw_jobs = data.get("jobs", [])

        results = []
        for j in raw_jobs:
            desc = strip_html(j.get("description", ""))
            # Truncate description to ~800 chars for Gemini context efficiency
            if len(desc) > 800:
                desc = desc[:800] + "..."
            # Parse publication date
            posted = j.get("publication_date", "") or ""
            # Remotive returns ISO format like "2024-01-15T00:00:00"
            if posted and "T" in posted:
                posted = posted.split("T")[0]
            results.append({
                "title": j.get("title", ""),
                "company": j.get("company_name", ""),
                "location": j.get("candidate_required_location", "Remote"),
                "description": desc,
                "url": j.get("url", ""),
                "tags": j.get("tags", []),
                "salary": j.get("salary", ""),
                "source": "Remotive",
                "posted_date": posted,
            })
        return results
    except Exception as e:
        print(f"[JobSource] Remotive error: {e}")
        return []


# ── Arbeitnow ───────────────────────────────────────────────────────

def fetch_arbeitnow_jobs(query, limit=25):
    """
    Fetch jobs from Arbeitnow API and filter by query keywords.
    Returns list of dicts: {title, company, location, description, url, tags, salary, source}
    """
    try:
        url = "https://www.arbeitnow.com/api/job-board-api"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        raw_jobs = data.get("data", [])

        # Arbeitnow has no search param — filter locally by keywords
        keywords = [w.lower() for w in query.split() if len(w) > 2]

        results = []
        for j in raw_jobs:
            title = (j.get("title", "") or "").lower()
            desc_raw = j.get("description", "") or ""
            desc_text = strip_html(desc_raw).lower()
            tags = [t.lower() for t in (j.get("tags", []) or [])]
            combined = f"{title} {desc_text} {' '.join(tags)}"

            # Match if any keyword appears in title/tags/description
            if keywords and not any(kw in combined for kw in keywords):
                continue

            desc = strip_html(desc_raw)
            if len(desc) > 800:
                desc = desc[:800] + "..."

            results.append({
                "title": j.get("title", ""),
                "company": j.get("company_name", ""),
                "location": j.get("location", "") or ("Remote" if j.get("remote") else ""),
                "description": desc,
                "url": j.get("url", ""),
                "tags": j.get("tags", []) or [],
                "salary": "",
                "source": "Arbeitnow",
                "posted_date": "",
            })

            if len(results) >= limit:
                break

        return results
    except Exception as e:
        print(f"[JobSource] Arbeitnow error: {e}")
        return []


# ── BDJobs (Bangladesh) ─────────────────────────────────────────

BDJOBS_LIST_URL = "https://gateway.bdjobs.com/recruitment-account-test/api/JobSearch/GetJobSearch"
BDJOBS_DETAIL_URL = "https://gateway.bdjobs.com/ActtivejobsTest/api/JobSubsystem/jobDetails"
BDJOBS_APPLY_URL = "https://jobs.bdjobs.com/jobdetails/?id={job_id}"


def _fetch_bdjobs_detail(job_id):
    """Fetch full job details from BDJobs. Returns dict or None."""
    try:
        r = requests.get(BDJOBS_DETAIL_URL, params={"jobId": job_id}, timeout=8)
        r.raise_for_status()
        data = r.json()
        items = data.get("data")
        if isinstance(items, list) and items:
            return items[0]
        if isinstance(items, dict):
            return items
        return None
    except Exception as e:
        print(f"[JobSource] BDJobs detail error for {job_id}: {e}")
        return None


def fetch_bdjobs(query, limit=25):
    """
    Fetch jobs from BDJobs API (Bangladesh's largest job portal).
    Returns list of dicts: {title, company, location, description, url, tags, salary, source, posted_date}
    """
    try:
        # Fetch 3 pages (~180 jobs) to get good coverage
        all_listings = []
        for page in range(1, 4):
            try:
                r = requests.get(
                    BDJOBS_LIST_URL,
                    params={"isPro": 1, "rpp": 60, "pg": page},
                    timeout=10,
                )
                r.raise_for_status()
                data = r.json()
                page_jobs = (data.get("data") or []) + (data.get("premiumData") or [])
                all_listings.extend(page_jobs)
                if not page_jobs:
                    break
            except Exception as e:
                print(f"[JobSource] BDJobs list page {page} error: {e}")
                break

        if not all_listings:
            return []

        # Filter locally by query keywords (same approach as Arbeitnow)
        keywords = [w.lower() for w in query.split() if len(w) > 2]

        filtered = []
        for j in all_listings:
            title = (j.get("jobTitle", "") or "").lower()
            company = (j.get("companyName", "") or "").lower()
            location = (j.get("location", "") or "").lower()
            combined = f"{title} {company} {location}"
            if keywords and not any(kw in combined for kw in keywords):
                continue
            filtered.append(j)
            if len(filtered) >= limit:
                break

        # Fetch details for filtered jobs (description, skills) — concurrent
        results = []

        def _process(j):
            job_id = j.get("Jobid", "")
            detail = _fetch_bdjobs_detail(job_id) if job_id else None

            # Build description from detail or fallback
            desc = ""
            tags = []
            if detail:
                desc = strip_html(detail.get("JobDescription", ""))
                skills_str = detail.get("SkillsRequired", "") or ""
                tags = [s.strip() for s in skills_str.split(",") if s.strip()]
                edu = strip_html(detail.get("EducationRequirements", ""))
                exp = strip_html(detail.get("experience", ""))
                desc_parts = [desc]
                if edu:
                    desc_parts.append(f"Education: {edu}")
                if exp:
                    desc_parts.append(f"Experience: {exp}")
                desc = " | ".join(desc_parts)

            if len(desc) > 800:
                desc = desc[:800] + "..."

            # Salary
            sal_obj = j.get("Salary") or {}
            min_sal = sal_obj.get("MinSalary", 0) or 0
            max_sal = sal_obj.get("MaxSalary", 0) or 0
            if min_sal and max_sal and max_sal > 0:
                salary = f"BDT {min_sal:,} - {max_sal:,}/month"
            elif min_sal:
                salary = f"BDT {min_sal:,}+/month"
            else:
                salary = "Negotiable"

            # Deadline
            deadline = j.get("deadline", "") or ""

            # Posted date
            posted = j.get("publishDate", "") or ""
            if posted and "T" in posted:
                posted = posted.split("T")[0]

            return {
                "title": j.get("jobTitle", ""),
                "company": j.get("companyName", ""),
                "location": j.get("location", "Bangladesh"),
                "description": desc,
                "url": BDJOBS_APPLY_URL.format(job_id=job_id),
                "tags": tags[:10],
                "salary": salary,
                "source": "BDJobs",
                "posted_date": posted,
                "deadline": deadline,
            }

        # Fetch details concurrently (max 5 workers to be gentle on the API)
        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = [pool.submit(_process, j) for j in filtered]
            for f in as_completed(futures):
                try:
                    result = f.result()
                    if result:
                        results.append(result)
                except Exception as e:
                    print(f"[JobSource] BDJobs detail worker error: {e}")

        return results

    except Exception as e:
        print(f"[JobSource] BDJobs error: {e}")
        return []


# ── Aggregator ──────────────────────────────────────────────────────

def fetch_all_jobs(query, limit_per_source=25):
    """
    Fetch jobs from all sources concurrently, deduplicate by URL.
    Returns merged list of job dicts.
    """
    all_jobs = []
    seen_urls = set()

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(fetch_remotive_jobs, query, limit_per_source): "remotive",
            executor.submit(fetch_arbeitnow_jobs, query, limit_per_source): "arbeitnow",
            executor.submit(fetch_bdjobs, query, limit_per_source): "bdjobs",
        }
        for future in as_completed(futures):
            try:
                jobs = future.result()
                for j in jobs:
                    url = j.get("url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        all_jobs.append(j)
            except Exception as e:
                print(f"[JobSource] Source error: {e}")

    return all_jobs
