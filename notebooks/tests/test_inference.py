"""Unit tests for notebooks/utils/inference.py."""

from unittest.mock import MagicMock

import pytest
from elasticsearch import BadRequestError

from utils.inference import (
    verify_embedding_endpoint,
    create_embedding_inference,
    create_reranker_inference,
)


class TestVerifyEmbeddingEndpoint:
    def test_returns_true_when_exists(self):
        es = MagicMock()
        assert verify_embedding_endpoint(es, ".jina-embeddings-v5-text-small") is True
        es.inference.get.assert_called_once_with(
            inference_id=".jina-embeddings-v5-text-small"
        )

    def test_returns_false_when_not_found(self):
        es = MagicMock()
        es.inference.get.side_effect = Exception("not found")
        assert verify_embedding_endpoint(es, ".jina-embeddings-v5-text-small") is False


class TestCreateEmbeddingInferenceCompat:
    """The legacy wrapper delegates to verify_embedding_endpoint."""

    def test_delegates_to_verify(self):
        es = MagicMock()
        assert create_embedding_inference(es, ".jina-embeddings-v5-text-small") is True
        es.inference.get.assert_called_once()


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
