"""Unit tests for notebooks/utils/inference.py."""

from unittest.mock import MagicMock

import pytest
from elasticsearch import BadRequestError

from utils.inference import create_embedding_inference, create_reranker_inference


class TestCreateEmbeddingInference:
    def test_creates_successfully(self):
        es = MagicMock()
        assert create_embedding_inference(es, "jina-emb-test") is True
        es.inference.put.assert_called_once()

    def test_returns_false_when_already_exists(self):
        es = MagicMock()
        es.inference.put.side_effect = BadRequestError(
            message="resource_already_exists_exception",
            meta=MagicMock(),
            body={},
        )
        assert create_embedding_inference(es, "jina-emb-test") is False

    def test_reraises_other_bad_request(self):
        es = MagicMock()
        es.inference.put.side_effect = BadRequestError(
            message="something else went wrong",
            meta=MagicMock(),
            body={},
        )
        with pytest.raises(BadRequestError, match="something else"):
            create_embedding_inference(es, "jina-emb-test")


class TestCreateRerankerInference:
    def test_creates_successfully(self):
        es = MagicMock()
        assert create_reranker_inference(es, "jina-rr-test") is True
        es.inference.put.assert_called_once()

    def test_returns_false_when_already_exists(self):
        es = MagicMock()
        es.inference.put.side_effect = BadRequestError(
            message="[already exists]",
            meta=MagicMock(),
            body={},
        )
        assert create_reranker_inference(es, "jina-rr-test") is False

    def test_reraises_other_bad_request(self):
        es = MagicMock()
        es.inference.put.side_effect = BadRequestError(
            message="invalid model config",
            meta=MagicMock(),
            body={},
        )
        with pytest.raises(BadRequestError, match="invalid model"):
            create_reranker_inference(es, "jina-rr-test")
