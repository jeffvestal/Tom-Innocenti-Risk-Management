"""
Inference endpoint management for Elastic Inference Service (EIS).

Provides idempotent creation of Jina embedding and reranker endpoints.
"""

from elasticsearch import BadRequestError


def verify_embedding_endpoint(es_client, inference_id: str) -> bool:
    """Verify the built-in Jina Embeddings v5 endpoint exists on Serverless.

    ``.jina-embeddings-v5-text-small`` is pre-configured — no creation needed.
    Returns ``True`` if available, ``False`` otherwise.
    """
    try:
        es_client.inference.get(inference_id=inference_id)
        print(f"\u2713 Built-in embedding endpoint available: {inference_id}")
        return True
    except Exception:
        print(f"\u2717 Built-in embedding endpoint not found: {inference_id}")
        return False


def create_embedding_inference(es_client, inference_id: str) -> bool:
    """Backwards-compatible wrapper — delegates to verify_embedding_endpoint."""
    return verify_embedding_endpoint(es_client, inference_id)


def create_reranker_inference(es_client, inference_id: str) -> bool:
    """Create a Jina Reranker v2 inference endpoint.

    Returns ``True`` if created, ``False`` if it already existed.
    Re-raises ``BadRequestError`` for any reason other than
    *resource_already_exists*.
    """
    try:
        es_client.inference.put(
            inference_id=inference_id,
            task_type="rerank",
            inference_config={
                "service": "jinaai",
                "service_settings": {
                    "model_id": "jina-reranker-v2-base-multilingual"
                },
            },
        )
        print(f"\u2713 Created reranker endpoint: {inference_id}")
        return True

    except BadRequestError as e:
        if _is_already_exists(e):
            print(f"\u2713 Reranker endpoint already exists: {inference_id}")
            return False
        raise


def _is_already_exists(err: BadRequestError) -> bool:
    msg = str(err).lower()
    return "resource_already_exists_exception" in msg or "already exists" in msg
