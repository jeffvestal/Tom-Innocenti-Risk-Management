"""
Integration tests: execute notebooks against real Elastic + Jina services.

Credentials are resolved via the standard fallback chain:
  1. ui/.env.local (primary)
  2. .env (override)
  3. Environment variables

Skipped automatically when no credentials are available.
Run with: pytest -m integration
"""

import json
import os
import shutil
from pathlib import Path

import pytest

NOTEBOOKS_DIR = Path(__file__).parent.parent
PROJECT_ROOT = NOTEBOOKS_DIR.parent
UI_ENV = PROJECT_ROOT / "ui" / ".env.local"
NB_ENV = PROJECT_ROOT / ".env"

_has_credentials = UI_ENV.exists() or NB_ENV.exists() or os.getenv("ELASTIC_API_KEY")

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not _has_credentials,
        reason="No credentials found (checked ui/.env.local, .env, and ELASTIC_API_KEY env var)",
    ),
]


@pytest.fixture(scope="module")
def integration_env(tmp_path_factory):
    """Set USER_SUFFIX to isolate test data from real user data."""
    old_suffix = os.environ.get("USER_SUFFIX")
    os.environ["USER_SUFFIX"] = "pytest"
    yield
    if old_suffix is not None:
        os.environ["USER_SUFFIX"] = old_suffix
    else:
        os.environ.pop("USER_SUFFIX", None)


@pytest.fixture(scope="module")
def output_dir(tmp_path_factory):
    """Temporary directory for notebook output files."""
    return tmp_path_factory.mktemp("nb_output")


def _run_notebook(notebook_name: str, output_path: Path):
    """Execute a notebook via papermill."""
    import papermill as pm

    input_path = str(NOTEBOOKS_DIR / notebook_name)
    out_file = str(output_path / notebook_name)

    pm.execute_notebook(
        input_path,
        out_file,
        cwd=str(NOTEBOOKS_DIR),
        kernel_name="python3",
    )
    return out_file


class TestFullPipeline:
    """Run all three notebooks sequentially against real services."""

    def test_01_ingest(self, integration_env, output_dir):
        _run_notebook("01_ingest.ipynb", output_dir)

        data_file = PROJECT_ROOT / "data" / "eu_ai_act_clean.json"
        assert data_file.exists(), "Notebook 01 should produce data/eu_ai_act_clean.json"

        with open(data_file) as f:
            articles = json.load(f)
        assert len(articles) > 50, f"Expected 50+ articles, got {len(articles)}"

        for art in articles:
            assert "id" in art
            assert "article_number" in art
            assert "text" in art
            assert len(art["text"]) > 0

    def test_02_index(self, integration_env, output_dir):
        _run_notebook("02_index.ipynb", output_dir)

    def test_03_rerank(self, integration_env, output_dir):
        _run_notebook("03_rerank.ipynb", output_dir)

    def test_cleanup(self, integration_env):
        """Remove test index and inference endpoints created during the run."""
        try:
            from utils.credentials import (
                get_credentials, get_elasticsearch_client,
                get_index_name, get_inference_id,
            )
            creds = get_credentials(save_prompt=False)
            es = get_elasticsearch_client(creds)

            idx = get_index_name("search-eu-ai-act")
            if es.indices.exists(index=idx):
                es.indices.delete(index=idx)
                print(f"Cleaned up index: {idx}")

            for model_type in ("embeddings", "reranker"):
                inf_id = get_inference_id(model_type)
                try:
                    es.inference.delete(inference_id=inf_id)
                    print(f"Cleaned up inference endpoint: {inf_id}")
                except Exception:
                    pass
        except Exception as e:
            print(f"Cleanup warning (non-fatal): {e}")
