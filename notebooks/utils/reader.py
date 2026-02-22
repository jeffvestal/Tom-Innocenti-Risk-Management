"""
Jina Reader API helper for fetching and converting URLs to markdown.
"""

import time

import requests


def fetch_with_jina_reader(
    url: str,
    api_key: str,
    max_retries: int = 3,
    min_content_length: int = 100,
) -> str:
    """Fetch a URL via Jina Reader and return clean markdown.

    Retries when the response body is shorter than *min_content_length*
    (empty / partial responses are transient failures for large PDFs).

    Args:
        url: The Jina Reader URL (``https://r.jina.ai/<target_url>``)
        api_key: Jina API key
        max_retries: Number of attempts before giving up
        min_content_length: Minimum acceptable response length

    Returns:
        Raw markdown text from Jina Reader

    Raises:
        requests.HTTPError: On non-2xx HTTP status
        ValueError: If all retries are exhausted with empty content
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "x-respond-with": "markdown",
        "Accept": "text/plain",
    }

    print("Fetching PDF via Jina Reader...")
    print("(This may take 30-60 seconds for a large document)")

    for attempt in range(max_retries):
        response = requests.get(url, headers=headers, timeout=120)
        response.raise_for_status()

        content = response.text.strip()

        if len(content) >= min_content_length:
            print(f"\u2713 Received {len(response.text):,} characters")
            return response.text

        if attempt < max_retries - 1:
            wait_time = (attempt + 1) * 5
            print(
                f"\u26a0 Empty response (attempt {attempt + 1}/{max_retries}). "
                f"Retrying in {wait_time}s..."
            )
            time.sleep(wait_time)
        else:
            print(f"\u2717 Failed after {max_retries} attempts — received empty content")

    raise ValueError(
        "Jina Reader returned empty content after multiple retries. "
        "This can happen due to rate limiting. Wait a minute and try again."
    )
