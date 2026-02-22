"""
Inference endpoint management for Elastic Inference Service (EIS).

Provides idempotent creation of Jina embedding and reranker endpoints.
"""

from elasticsearch import BadRequestError


def create_embedding_inference(es_client, inference_id: str) -> bool:
    """Create a Jina Embeddings v3 inference endpoint.

    Returns ``True`` if created, ``False`` if it already existed.
    Re-raises ``BadRequestError`` for any reason other than
    *resource_already_exists*.
    """
    try:
        es_client.inference.put(
            inference_id=inference_id,
            task_type="text_embedding",
            inference_config={
                "service": "jinaai",
                "service_settings": {
                    "model_id": "jina-embeddings-v3"
                },
            },
        )
        print(f"\u2713 Created inference endpoint: {inference_id}")
        return True

    except BadRequestError as e:
        if _is_already_exists(e):
            print(f"\u2713 Inference endpoint already exists: {inference_id}")
            return False
        raise


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
