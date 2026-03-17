from __future__ import annotations

from bs4 import BeautifulSoup


def html_to_text(html: str | None) -> str:
    """Convert job HTML description to reasonably clean plain text."""
    if not html:
        return ""

    soup = BeautifulSoup(html, "lxml")

    # Replace <br> with newlines so we don't lose formatting.
    for br in soup.find_all("br"):
        br.replace_with("\n")

    # Add newlines before list items to preserve bullets in text form.
    for li in soup.find_all("li"):
        li.insert_before("\n- ")

    text = soup.get_text(separator="\n")
    # Normalize whitespace a bit
    lines = [line.strip() for line in text.splitlines()]
    cleaned = "\n".join(line for line in lines if line)
    return cleaned.strip()

