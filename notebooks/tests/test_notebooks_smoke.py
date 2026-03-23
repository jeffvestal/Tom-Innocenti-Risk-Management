"""
Smoke tests: execute each notebook with mocked external services.

These tests verify that notebooks run without errors — import ordering,
cell dependencies, Colab/local path logic — without hitting real APIs.
"""

import json
import re
from pathlib import Path

import nbformat
import pytest
from nbclient import NotebookClient
from jupyter_client.kernelspec import KernelSpecManager

NOTEBOOKS_DIR = Path(__file__).parent.parent
FIXTURES_DIR = Path(__file__).parent / "fixtures"

pytestmark = pytest.mark.smoke


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_kernel_name() -> str:
    """Find a usable Python kernel, preferring 'python3'."""
    ksm = KernelSpecManager()
    specs = ksm.get_all_specs()
    if "python3" in specs:
        return "python3"
    for name, info in specs.items():
        if info.get("spec", {}).get("language", "").lower() == "python":
            return name
    pytest.skip("No Python Jupyter kernel found — install ipykernel")


def _load_notebook(name: str) -> nbformat.NotebookNode:
    path = NOTEBOOKS_DIR / name
    return nbformat.read(str(path), as_version=4)


def _find_cell_index(nb: nbformat.NotebookNode, pattern: str) -> int:
    """Return the index of the first cell whose source matches *pattern*.

    Raises ``LookupError`` if no cell matches, which makes smoke-test
    failures easy to diagnose when notebook layout changes.
    """
    regex = re.compile(pattern)
    for idx, cell in enumerate(nb.cells):
        if regex.search(cell.source):
            return idx
    raise LookupError(f"No cell matching pattern {pattern!r}")


def _make_env_setup_cell() -> nbformat.NotebookNode:
    """Cell that sets credential env vars and ensures utils is importable."""
    notebooks_dir_str = str(NOTEBOOKS_DIR).replace("\\", "\\\\")
    return nbformat.v4.new_code_cell(source=(
        "import os, sys\n"
        f"sys.path.insert(0, {notebooks_dir_str!r})\n"
        "os.environ['ELASTICSEARCH_URL'] = 'https://test.es.cloud:443'\n"
        "os.environ['ELASTIC_API_KEY'] = 'dGVzdC1rZXk='\n"
        "os.environ['JINA_API_KEY'] = 'jina_test_key'\n"
    ))


_SKIP_INSTALL_CELL = nbformat.v4.new_code_cell(source=(
    "print('Smoke test: skipping install')\n"
))


def _replace_install_cell(nb: nbformat.NotebookNode) -> None:
    """Replace the pip-install cell with a no-op."""
    idx = _find_cell_index(nb, r"!pip install")
    nb.cells[idx] = nbformat.v4.new_code_cell(source=_SKIP_INSTALL_CELL.source)


def _inject_before_install(
    nb: nbformat.NotebookNode,
    *cells: nbformat.NotebookNode,
) -> None:
    """Insert *cells* immediately before the pip-install cell."""
    idx = _find_cell_index(nb, r"!pip install")
    for offset, cell in enumerate(cells):
        nb.cells.insert(idx + offset, cell)


def _execute(nb: nbformat.NotebookNode, cwd: str) -> nbformat.NotebookNode:
    client = NotebookClient(
        nb,
        timeout=120,
        kernel_name=_get_kernel_name(),
        resources={"metadata": {"path": cwd}},
    )
    return client.execute()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestNotebook01FullChain:
    """Smoke test for 01_full_chain.ipynb — full pipeline: ingest → index → search → rerank."""

    def test_executes_without_error(self, tmp_path):
        nb = _load_notebook("01_full_chain.ipynb")

        sample_md = (FIXTURES_DIR / "sample_jina_response.md").read_text()

        mock_cell = nbformat.v4.new_code_cell(source="\n".join([
            "import unittest.mock as _mock",
            "import requests as _req",
            "import elasticsearch as _es_mod",
            "import elasticsearch.helpers as _es_helpers",
            "import time as _time_mod",
            "",
            "# Mock Jina Reader API",
            "_resp = _mock.Mock()",
            f"_resp.json.return_value = {{'data': {{'content': {json.dumps(sample_md)}}}}}",
            "_resp.raise_for_status = _mock.Mock()",
            "_req.post = _mock.Mock(return_value=_resp)",
            "",
            "# Mock Elasticsearch client",
            "_mock_es = _mock.MagicMock()",
            "_mock_es.info.return_value = {'version': {'number': '8.17.0'}, 'cluster_name': 'smoke-test'}",
            "_mock_es.indices.exists.return_value = False",
            "_mock_es.indices.create.return_value = {'acknowledged': True}",
            "_mock_es.count.return_value = {'count': 3}",
            "_mock_es.search.return_value = {",
            "    'hits': {'total': {'value': 3}, 'hits': [",
            "        {'_source': {'article_number': 5, 'title': 'Prohibited AI practices'}, '_score': 1.0}",
            "    ]}",
            "}",
            "_es_mod.Elasticsearch = _mock.Mock(return_value=_mock_es)",
            "_es_helpers.bulk = _mock.Mock(return_value=(3, []))",
            "",
            "# Skip the 5-second embedding wait",
            "_time_mod.sleep = _mock.Mock()",
        ]))

        _inject_before_install(nb, _make_env_setup_cell(), mock_cell)
        _replace_install_cell(nb)

        nb_dir = tmp_path / "notebooks"
        nb_dir.mkdir()
        _execute(nb, str(nb_dir))


class TestNotebook02EisPlatform:
    """Smoke test for 02_eis_platform.ipynb — EIS endpoint exploration."""

    def test_executes_without_error(self, tmp_path):
        nb = _load_notebook("02_eis_platform.ipynb")

        mock_cell = nbformat.v4.new_code_cell(source="\n".join([
            "import unittest.mock as _mock",
            "import elasticsearch as _es_mod",
            "",
            "_mock_es = _mock.MagicMock()",
            "_mock_es.info.return_value = {'version': {'number': '8.17.0'}, 'cluster_name': 'smoke-test'}",
            "",
            "# Endpoints list: embedding only, no chat — skips streaming block",
            "_eps = [",
            "    {'inference_id': '.jina-embeddings-v5-text-small', 'task_type': 'text_embedding',",
            "     'service': 'jinaai', 'service_settings': {'model_id': 'jina-embeddings-v5-text-small'}},",
            "    {'inference_id': '.elser-2-elastic', 'task_type': 'sparse_embedding',",
            "     'service': 'elastic', 'service_settings': {'model_id': 'elser_model_2'}},",
            "]",
            "_mock_es.inference.get.return_value = {'endpoints': _eps}",
            "_mock_es.inference.inference.return_value = {'text_embedding': [{'embedding': [0.1] * 10}]}",
            "_mock_es.inference.put.return_value = {'acknowledged': True}",
            "_es_mod.Elasticsearch = _mock.Mock(return_value=_mock_es)",
        ]))

        _inject_before_install(nb, _make_env_setup_cell(), mock_cell)
        _replace_install_cell(nb)

        nb_dir = tmp_path / "notebooks"
        nb_dir.mkdir()
        _execute(nb, str(nb_dir))
