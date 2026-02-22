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
        "os.environ['ELASTIC_URL'] = 'https://test.es.cloud:443'\n"
        "os.environ['ELASTIC_API_KEY'] = 'dGVzdC1rZXk='\n"
        "os.environ['JINA_API_KEY'] = 'jina_test_key'\n"
        "os.environ['USER_SUFFIX'] = 'smoketest'\n"
    ))


_SKIP_INSTALL_CELL = nbformat.v4.new_code_cell(source=(
    "import os\n"
    "IN_COLAB = False\n"
    "print('Smoke test: skipping install + Colab setup')\n"
))


def _replace_install_cell(nb: nbformat.NotebookNode) -> None:
    """Replace the pip-install / Colab-setup cell with a no-op."""
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


def _replace_paths(nb: nbformat.NotebookNode, old: str, new: str) -> int:
    """Replace *old* with *new* across all cells, returning replacement count."""
    count = 0
    for cell in nb.cells:
        if hasattr(cell, "source") and old in cell.source:
            cell.source = cell.source.replace(old, new)
            count += 1
    return count


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

class TestNotebook01Ingest:
    """Smoke test for 01_ingest.ipynb with mocked Jina Reader."""

    def test_executes_without_error(self, tmp_path):
        nb = _load_notebook("01_ingest.ipynb")

        sample_md = (FIXTURES_DIR / "sample_jina_response.md").read_text()

        mock_cell = nbformat.v4.new_code_cell(source=(
            "import unittest.mock as _mock\n"
            "import requests as _req\n"
            f"_resp = _mock.Mock()\n"
            f"_resp.text = {json.dumps(sample_md)}\n"
            "_resp.raise_for_status = _mock.Mock()\n"
            "_req.get = _mock.Mock(return_value=_resp)\n"
        ))

        _inject_before_install(nb, _make_env_setup_cell(), mock_cell)
        _replace_install_cell(nb)

        data_dir = tmp_path / "data"
        data_dir.mkdir()
        nb_dir = tmp_path / "notebooks"
        nb_dir.mkdir()

        replaced = _replace_paths(
            nb, 'Path.cwd().parent / "data"', f'Path("{data_dir}")'
        )
        assert replaced >= 1, "Expected at least one data-path replacement in NB 01"

        _execute(nb, str(nb_dir))

        output_file = data_dir / "eu_ai_act_clean.json"
        assert output_file.exists(), "Expected eu_ai_act_clean.json to be created"

        with open(output_file) as f:
            articles = json.load(f)
        assert len(articles) == 3


class TestNotebook02Index:
    """Smoke test for 02_index.ipynb with mocked Elasticsearch."""

    def test_executes_without_error(self, tmp_path, sample_articles):
        nb = _load_notebook("02_index.ipynb")

        data_dir = tmp_path / "data"
        data_dir.mkdir()
        (data_dir / "eu_ai_act_clean.json").write_text(json.dumps(sample_articles))

        mock_cell = nbformat.v4.new_code_cell(source=(
            "import unittest.mock as _mock\n"
            "import elasticsearch as _es_mod\n"
            "import elasticsearch.helpers as _es_helpers\n"
            "\n"
            "_mock_es = _mock.MagicMock()\n"
            "_mock_es.info.return_value = {\n"
            "    'version': {'number': '8.17.0'},\n"
            "    'cluster_name': 'smoke-test'\n"
            "}\n"
            "_mock_es.indices.exists.return_value = False\n"
            "_mock_es.indices.create.return_value = {'acknowledged': True}\n"
            "_mock_es.count.return_value = {'count': 3}\n"
            "_mock_es.search.return_value = {\n"
            "    'hits': {'total': {'value': 3}, 'hits': [\n"
            "        {'_source': {'article_number': '5', 'title': 'Test'}, '_score': 1.0}\n"
            "    ]}\n"
            "}\n"
            "_mock_es.get.return_value = {\n"
            "    '_id': 'en_art_5',\n"
            "    '_source': {'article_number': '5', 'title': 'Test', 'text': 'body'}\n"
            "}\n"
            "\n"
            "_es_mod.Elasticsearch = _mock.Mock(return_value=_mock_es)\n"
            "_es_helpers.bulk = _mock.Mock(return_value=(3, []))\n"
        ))

        _inject_before_install(nb, _make_env_setup_cell(), mock_cell)
        _replace_install_cell(nb)

        replaced = _replace_paths(
            nb,
            'Path.cwd().parent / "data" / "eu_ai_act_clean.json"',
            f'Path("{data_dir / "eu_ai_act_clean.json"}")',
        )
        assert replaced >= 1, "Expected at least one data-path replacement in NB 02"

        nb_dir = tmp_path / "notebooks"
        nb_dir.mkdir()
        _execute(nb, str(nb_dir))


class TestNotebook03Rerank:
    """Smoke test for 03_rerank.ipynb with mocked Elasticsearch."""

    def test_executes_without_error(self, tmp_path):
        nb = _load_notebook("03_rerank.ipynb")

        hits_naive = json.dumps([
            {"_source": {"article_number": str(i), "title": f"Art {i}", "text": f"body {i}"}, "_score": 10 - i}
            for i in range(1, 11)
        ])
        hits_reranked = json.dumps([
            {"_source": {"article_number": str(i), "title": f"Art {i}", "text": f"body {i}"}, "_score": 0.9 - i * 0.05}
            for i in [5, 3, 1, 2, 4, 6, 7, 8, 9, 10]
        ])

        mock_cell = nbformat.v4.new_code_cell(source=(
            "import unittest.mock as _mock\n"
            "import json as _json\n"
            "import elasticsearch as _es_mod\n"
            "\n"
            f"_hits_naive = _json.loads('''{hits_naive}''')\n"
            f"_hits_reranked = _json.loads('''{hits_reranked}''')\n"
            "\n"
            "_call_count = [0]\n"
            "def _search_side_effect(**kwargs):\n"
            "    if 'retriever' in kwargs or 'retriever' in kwargs.get('body', {}):\n"
            "        hits = _hits_reranked\n"
            "    else:\n"
            "        hits = _hits_naive\n"
            "    return {'hits': {'total': {'value': len(hits)}, 'hits': hits}}\n"
            "\n"
            "_mock_es = _mock.MagicMock()\n"
            "_mock_es.info.return_value = {\n"
            "    'version': {'number': '8.17.0'},\n"
            "    'cluster_name': 'smoke-test'\n"
            "}\n"
            "_mock_es.indices.exists.return_value = True\n"
            "_mock_es.count.return_value = {'count': 80}\n"
            "_mock_es.search.side_effect = _search_side_effect\n"
            "\n"
            "_es_mod.Elasticsearch = _mock.Mock(return_value=_mock_es)\n"
        ))

        _inject_before_install(nb, _make_env_setup_cell(), mock_cell)
        _replace_install_cell(nb)

        nb_dir = tmp_path / "notebooks"
        nb_dir.mkdir()
        _execute(nb, str(nb_dir))
