"""
Article parsing utilities for the EU AI Act ingestion pipeline.

Extracted from Notebook 01 for testability and reuse.
"""

import re


def parse_articles(markdown_text: str) -> list[dict]:
    """
    Parse EU AI Act markdown into structured article chunks.

    Splits on "Article N" boundaries, capturing article number, title,
    and body text while preserving legal context.

    Args:
        markdown_text: Raw markdown from Jina Reader

    Returns:
        List of article dicts with keys: id, article_number, title, text, language, url
    """
    articles = []

    article_pattern = r'^(?:#+ )?Article\s+(\d+)\s*\n+([^\n]+)?'

    splits = re.split(r'(?=^(?:#+ )?Article\s+\d+)', markdown_text, flags=re.MULTILINE)

    for chunk in splits:
        if not chunk.strip():
            continue

        match = re.match(article_pattern, chunk, re.MULTILINE)
        if match:
            article_num = match.group(1)
            title_candidate = match.group(2) if match.group(2) else ""
            title = title_candidate.strip() if title_candidate else f"Article {article_num}"

            body_start = match.end()
            body = chunk[body_start:].strip()

            body = re.sub(r'\n{3,}', '\n\n', body)
            body = body.strip()

            if body:
                articles.append({
                    "id": f"en_art_{article_num}",
                    "article_number": article_num,
                    "title": title,
                    "text": body,
                    "language": "en",
                    "url": f"https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#Art{article_num}"
                })

    return articles
