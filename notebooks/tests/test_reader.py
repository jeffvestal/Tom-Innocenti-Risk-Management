"""Unit tests for notebooks/utils/reader.py."""

from unittest.mock import Mock, patch

import pytest
import requests

from utils.reader import fetch_with_jina_reader


def _make_response(text: str, status: int = 200) -> Mock:
    resp = Mock()
    resp.text = text
    resp.status_code = status
    resp.raise_for_status = Mock()
    if status >= 400:
        resp.raise_for_status.side_effect = requests.HTTPError(response=resp)
    return resp


class TestFetchWithJinaReader:
    @patch("utils.reader.requests.get")
    def test_success_on_first_try(self, mock_get):
        mock_get.return_value = _make_response("A" * 200)
        result = fetch_with_jina_reader("https://r.jina.ai/test", "key")
        assert len(result) == 200
        assert mock_get.call_count == 1

    @patch("utils.reader.time.sleep")
    @patch("utils.reader.requests.get")
    def test_retries_on_empty_then_succeeds(self, mock_get, mock_sleep):
        mock_get.side_effect = [
            _make_response("short"),
            _make_response("B" * 500),
        ]
        result = fetch_with_jina_reader("https://r.jina.ai/test", "key", max_retries=2)
        assert len(result) == 500
        assert mock_get.call_count == 2
        mock_sleep.assert_called_once_with(5)

    @patch("utils.reader.time.sleep")
    @patch("utils.reader.requests.get")
    def test_raises_after_all_retries_exhausted(self, mock_get, mock_sleep):
        mock_get.return_value = _make_response("tiny")
        with pytest.raises(ValueError, match="empty content after multiple retries"):
            fetch_with_jina_reader("https://r.jina.ai/test", "key", max_retries=3)
        assert mock_get.call_count == 3

    @patch("utils.reader.requests.get")
    def test_http_error_propagates(self, mock_get):
        mock_get.return_value = _make_response("", status=500)
        with pytest.raises(requests.HTTPError):
            fetch_with_jina_reader("https://r.jina.ai/test", "key")

    @patch("utils.reader.requests.get")
    def test_custom_min_content_length(self, mock_get):
        mock_get.return_value = _make_response("X" * 50)
        result = fetch_with_jina_reader(
            "https://r.jina.ai/test", "key", min_content_length=10
        )
        assert len(result) == 50

    @patch("utils.reader.requests.get")
    def test_auth_header_sent(self, mock_get):
        mock_get.return_value = _make_response("A" * 200)
        fetch_with_jina_reader("https://r.jina.ai/test", "my-secret-key")
        headers = mock_get.call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer my-secret-key"
