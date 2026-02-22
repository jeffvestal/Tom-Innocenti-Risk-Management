"""Unit tests for notebooks/utils/credentials.py."""

import os
from pathlib import Path
from unittest.mock import patch

import pytest


class TestGetIndexName:
    def test_with_suffix_env(self, monkeypatch):
        monkeypatch.setenv("USER_SUFFIX", "alice")
        from utils.credentials import get_index_name
        assert get_index_name() == "search-eu-ai-act-alice"

    def test_custom_base_name(self, monkeypatch):
        monkeypatch.setenv("USER_SUFFIX", "bob")
        from utils.credentials import get_index_name
        assert get_index_name("my-index") == "my-index-bob"


class TestGetInferenceId:
    def test_embeddings(self, monkeypatch):
        monkeypatch.setenv("USER_SUFFIX", "test")
        from utils.credentials import get_inference_id
        assert get_inference_id("embeddings") == "jina-embeddings-v3-test"

    def test_reranker(self, monkeypatch):
        monkeypatch.setenv("USER_SUFFIX", "test")
        from utils.credentials import get_inference_id
        assert get_inference_id("reranker") == "jina-reranker-v3-test"

    def test_unknown_model_type(self, monkeypatch):
        monkeypatch.setenv("USER_SUFFIX", "test")
        from utils.credentials import get_inference_id
        with pytest.raises(ValueError, match="Unknown model_type"):
            get_inference_id("transformer")


class TestGetUserSuffix:
    def test_env_var_takes_priority(self, monkeypatch):
        monkeypatch.setenv("USER_SUFFIX", "fromenv")
        from utils.credentials import _get_user_suffix
        assert _get_user_suffix() == "fromenv"

    def test_falls_back_to_username(self, clean_env, monkeypatch):
        monkeypatch.delenv("USER_SUFFIX", raising=False)
        with patch("os.getlogin", return_value="TestUser"):
            from utils.credentials import _get_user_suffix
            result = _get_user_suffix()
            assert result == "testuser"

    def test_generates_random_on_failure(self, clean_env, monkeypatch):
        monkeypatch.delenv("USER_SUFFIX", raising=False)
        with patch("os.getlogin", side_effect=OSError):
            from utils.credentials import _get_user_suffix
            result = _get_user_suffix()
            assert len(result) == 4
            assert result.isalnum()


class TestCredentialFallbackChain:
    """Test that ui/.env.local is loaded as primary, .env as override."""

    def test_loads_from_env_vars_without_prompting(self, clean_env, monkeypatch):
        monkeypatch.setenv("ELASTIC_URL", "https://test.elastic.cloud:443")
        monkeypatch.setenv("ELASTIC_API_KEY", "test-key")
        monkeypatch.setenv("JINA_API_KEY", "jina-test")
        monkeypatch.setenv("USER_SUFFIX", "test")

        from utils.credentials import get_credentials
        with patch("utils.credentials.getpass.getpass") as mock_getpass:
            creds = get_credentials(save_prompt=False)
            mock_getpass.assert_not_called()

        assert creds["ELASTIC_URL"] == "https://test.elastic.cloud:443"
        assert creds["ELASTIC_API_KEY"] == "test-key"
        assert creds["JINA_API_KEY"] == "jina-test"

    def test_elasticsearch_url_mapped_to_elastic_url(self, clean_env, monkeypatch):
        """UI uses ELASTICSEARCH_URL; notebooks use ELASTIC_URL."""
        monkeypatch.setenv("ELASTICSEARCH_URL", "https://ui-cluster.elastic.cloud:443")
        monkeypatch.setenv("ELASTIC_API_KEY", "test-key")
        monkeypatch.setenv("JINA_API_KEY", "jina-test")
        monkeypatch.setenv("USER_SUFFIX", "test")

        from utils.credentials import get_credentials
        creds = get_credentials(save_prompt=False)

        assert creds["ELASTIC_URL"] == "https://ui-cluster.elastic.cloud:443"

    def test_elastic_url_not_overwritten_by_elasticsearch_url(self, clean_env, monkeypatch):
        """If ELASTIC_URL is already set, ELASTICSEARCH_URL doesn't clobber it."""
        monkeypatch.setenv("ELASTIC_URL", "https://notebook-cluster.elastic.cloud:443")
        monkeypatch.setenv("ELASTICSEARCH_URL", "https://ui-cluster.elastic.cloud:443")
        monkeypatch.setenv("ELASTIC_API_KEY", "test-key")
        monkeypatch.setenv("JINA_API_KEY", "jina-test")
        monkeypatch.setenv("USER_SUFFIX", "test")

        from utils.credentials import get_credentials
        creds = get_credentials(save_prompt=False)

        assert creds["ELASTIC_URL"] == "https://notebook-cluster.elastic.cloud:443"

    def test_ui_env_file_loaded_as_base(self, clean_env, tmp_path, monkeypatch):
        """Verify ui/.env.local is loaded with override=False."""
        import utils.credentials as creds_mod

        fake_ui_env = tmp_path / "ui_env"
        fake_ui_env.write_text(
            "ELASTIC_API_KEY=from-ui\n"
            "JINA_API_KEY=jina-from-ui\n"
            "ELASTICSEARCH_URL=https://ui.elastic.cloud:443\n"
        )
        monkeypatch.setattr(creds_mod, "UI_ENV_FILE", fake_ui_env)
        monkeypatch.setattr(creds_mod, "ENV_FILE", tmp_path / "nonexistent")
        monkeypatch.setenv("USER_SUFFIX", "test")

        creds = creds_mod.get_credentials(save_prompt=False)

        assert creds["ELASTIC_API_KEY"] == "from-ui"
        assert creds["JINA_API_KEY"] == "jina-from-ui"
        assert creds["ELASTIC_URL"] == "https://ui.elastic.cloud:443"

    def test_notebook_env_overrides_ui_env(self, clean_env, tmp_path, monkeypatch):
        """Values in .env override ui/.env.local."""
        import utils.credentials as creds_mod

        fake_ui_env = tmp_path / "ui_env"
        fake_ui_env.write_text(
            "ELASTIC_API_KEY=from-ui\n"
            "JINA_API_KEY=jina-from-ui\n"
            "ELASTICSEARCH_URL=https://ui.elastic.cloud:443\n"
        )
        fake_nb_env = tmp_path / "nb_env"
        fake_nb_env.write_text(
            "ELASTIC_API_KEY=from-notebook\n"
            "ELASTIC_URL=https://notebook.elastic.cloud:443\n"
        )

        monkeypatch.setattr(creds_mod, "UI_ENV_FILE", fake_ui_env)
        monkeypatch.setattr(creds_mod, "ENV_FILE", fake_nb_env)
        monkeypatch.setenv("USER_SUFFIX", "test")

        creds = creds_mod.get_credentials(save_prompt=False)

        assert creds["ELASTIC_API_KEY"] == "from-notebook"
        assert creds["ELASTIC_URL"] == "https://notebook.elastic.cloud:443"
        assert creds["JINA_API_KEY"] == "jina-from-ui"


class TestGetElasticsearchClient:
    def test_serverless_url(self):
        from utils.credentials import get_elasticsearch_client
        with patch("elasticsearch.Elasticsearch") as MockES:
            get_elasticsearch_client({
                "ELASTIC_URL": "https://test.elastic.cloud:443",
                "ELASTIC_API_KEY": "key123",
            })
            MockES.assert_called_once_with(
                hosts=["https://test.elastic.cloud:443"],
                api_key="key123",
            )

    def test_cloud_id(self):
        from utils.credentials import get_elasticsearch_client
        with patch("elasticsearch.Elasticsearch") as MockES:
            get_elasticsearch_client({
                "ELASTIC_CLOUD_ID": "my-cloud:abc123",
                "ELASTIC_API_KEY": "key456",
            })
            MockES.assert_called_once_with(
                cloud_id="my-cloud:abc123",
                api_key="key456",
            )

    def test_missing_endpoint_raises(self):
        from utils.credentials import get_elasticsearch_client
        with pytest.raises(ValueError, match="No ELASTIC_URL or ELASTIC_CLOUD_ID"):
            get_elasticsearch_client({"ELASTIC_API_KEY": "key"})
