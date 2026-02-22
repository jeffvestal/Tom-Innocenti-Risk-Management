"""Shared fixtures for notebook tests."""

import json
import os
import sys
from pathlib import Path

import pytest

FIXTURES_DIR = Path(__file__).parent / "fixtures"
NOTEBOOKS_DIR = Path(__file__).parent.parent
PROJECT_ROOT = NOTEBOOKS_DIR.parent


@pytest.fixture
def sample_markdown():
    """Trimmed Jina Reader markdown containing 3 articles."""
    return (FIXTURES_DIR / "sample_jina_response.md").read_text()


@pytest.fixture
def sample_articles():
    """Expected parsed articles matching the sample markdown."""
    with open(FIXTURES_DIR / "sample_articles.json") as f:
        return json.load(f)


@pytest.fixture
def mock_credentials():
    """Credential dict matching what get_credentials() returns."""
    return {
        "ELASTIC_URL": "https://test-cluster.es.us-east-1.aws.elastic.cloud:443",
        "ELASTIC_API_KEY": "dGVzdC1rZXk6dGVzdC12YWx1ZQ==",
        "JINA_API_KEY": "jina_test_key_1234567890",
        "USER_SUFFIX": "pytest",
    }


@pytest.fixture
def clean_env(monkeypatch):
    """Remove all credential-related env vars for a clean test."""
    for key in [
        "ELASTIC_URL", "ELASTIC_CLOUD_ID", "ELASTICSEARCH_URL",
        "ELASTIC_API_KEY", "JINA_API_KEY", "USER_SUFFIX",
        "COLAB_GPU", "COLAB_RELEASE_TAG",
    ]:
        monkeypatch.delenv(key, raising=False)


@pytest.fixture(autouse=True)
def _notebooks_on_path():
    """Ensure notebooks/ is on sys.path so `from utils import ...` works."""
    nb_str = str(NOTEBOOKS_DIR)
    if nb_str not in sys.path:
        sys.path.insert(0, nb_str)
    yield
    if nb_str in sys.path:
        sys.path.remove(nb_str)


def _make_es_hit(article_number: str, title: str, score: float = 1.0) -> dict:
    """Helper to build a fake ES hit dict for comparison tests."""
    return {
        "_score": score,
        "_source": {
            "article_number": article_number,
            "title": title,
            "text": f"Body text for article {article_number}",
        },
    }


@pytest.fixture
def make_es_hit():
    """Factory fixture for creating fake ES hit dicts."""
    return _make_es_hit
