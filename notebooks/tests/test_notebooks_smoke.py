"""
Smoke tests: execute each notebook with mocked external services.

These tests verify that notebooks run without errors — import ordering,
cell dependencies, Colab/local path logic — without hitting real APIs.
"""

import os
import json
from pathlib import Path

import nbformat
import pytest
from nbclient import NotebookClient
from jupyter_client.kernelspec import KernelSpecManager

NOTEBOOKS_DIR = Path(__file__).parent.parent
FIXTURES_DIR = Path(__file__).parent / "fixtures"

pytestmark = pytest.mark.smoke


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


def _execute(nb: nbformat.NotebookNode, cwd: str) -> nbformat.NotebookNode:
    client = NotebookClient(
        nb,
        timeout=120,
        kernel_name=_get_kernel_name(),
        resources={"metadata": {"path": cwd}},
    )
    return client.execute()


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

        # Insert env setup and mock before the first code cell
        # Cell 0 = markdown, Cell 1 = markdown, Cell 2 = first code (setup/install)
        nb.cells.insert(2, _make_env_setup_cell())
        nb.cells.insert(3, mock_cell)

        # Replace pip install cell (now at index 4 after inserts) to skip
        # the Colab clone and pip install
        nb.cells[4] = nbformat.v4.new_code_cell(source=(
            "import os\n"
            "IN_COLAB = False\n"
            "print('Smoke test: skipping install + Colab setup')\n"
        ))

        # Create the data output directory
        data_dir = tmp_path / "data"
        data_dir.mkdir()
        nb_dir = tmp_path / "notebooks"
        nb_dir.mkdir()

        # Patch output path to use tmp_path
        for cell in nb.cells:
            if hasattr(cell, "source"):
                cell.source = cell.source.replace(
                    'Path.cwd().parent / "data"',
                    f'Path("{data_dir}")',
                )

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

        # Write sample data for the notebook to load
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

        nb.cells.insert(2, _make_env_setup_cell())
        nb.cells.insert(3, mock_cell)

        # Skip pip install and Colab setup
        nb.cells[4] = nbformat.v4.new_code_cell(source=(
            "import os\n"
            "IN_COLAB = False\n"
            "print('Smoke test: skipping install + Colab setup')\n"
        ))

        # Patch the data file path
        for cell in nb.cells:
            if hasattr(cell, "source"):
                cell.source = cell.source.replace(
                    'Path.cwd().parent / "data" / "eu_ai_act_clean.json"',
                    f'Path("{data_dir / "eu_ai_act_clean.json"}")',
                )

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
            "    body = kwargs.get('body', {})\n"
            "    if 'retriever' in body:\n"
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

        nb.cells.insert(2, _make_env_setup_cell())
        nb.cells.insert(3, mock_cell)

        # Skip pip install and Colab setup
        nb.cells[4] = nbformat.v4.new_code_cell(source=(
            "import os\n"
            "IN_COLAB = False\n"
            "print('Smoke test: skipping install + Colab setup')\n"
        ))

        nb_dir = tmp_path / "notebooks"
        nb_dir.mkdir()
        _execute(nb, str(nb_dir))
