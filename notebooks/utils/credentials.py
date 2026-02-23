"""
Innocenti Risk Management - Credential Management Utility

This module provides secure credential handling for the enablement notebooks.

Credential resolution order:
  1. ui/.env.local   — primary source (shared with the Next.js UI)
  2. <project>/.env  — optional override for notebook-specific creds
  3. Environment vars — for CI / container injection
  4. Interactive prompt via getpass — last resort (Colab, first-time users)

Also generates a unique USER_SUFFIX for index naming to avoid collisions
when multiple users run against the same Elastic cluster.
"""

import os
import getpass
import random
import string
from pathlib import Path
from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).parent.parent.parent

# Primary: ui/.env.local (most users already have this from the UI)
UI_ENV_FILE = _PROJECT_ROOT / "ui" / ".env.local"

# Override: project-root .env (only needed if notebooks use different creds)
ENV_FILE = _PROJECT_ROOT / ".env"


def _generate_suffix() -> str:
    """Generate a random 4-character suffix for unique naming."""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))


def _get_user_suffix() -> str:
    """
    Get a unique suffix for index naming.
    Priority: 1) Existing .env value, 2) OS username, 3) Random 4-char string
    """
    # Check if already set in environment
    if os.getenv("USER_SUFFIX"):
        return os.getenv("USER_SUFFIX")
    
    # Try OS username (cleaned up)
    try:
        username = os.getlogin()
        # Clean up: lowercase, alphanumeric only, max 8 chars
        suffix = ''.join(c for c in username.lower() if c.isalnum())[:8]
        if suffix:
            return suffix
    except (OSError, AttributeError):
        pass
    
    # Fallback to random suffix
    return _generate_suffix()


def get_credentials(
    require_elastic: bool = True,
    require_jina: bool = True,
    save_prompt: bool = True
) -> dict:
    """
    Get credentials for Elastic and Jina services.
    
    On first run, prompts for credentials using getpass (secure input).
    Offers to save to .env for persistence across sessions.
    On subsequent runs, loads from .env automatically.
    
    Supports both:
    - Elastic Cloud (uses ELASTIC_CLOUD_ID)
    - Elastic Serverless (uses ELASTIC_URL)
    
    Args:
        require_elastic: Whether to require Elastic credentials
        require_jina: Whether to require Jina API key
        save_prompt: Whether to offer saving credentials to .env
    
    Returns:
        dict with keys: ELASTIC_URL or ELASTIC_CLOUD_ID, ELASTIC_API_KEY, JINA_API_KEY, USER_SUFFIX
    """
    # --- Load credentials (ui/.env.local is primary, .env is override) ---
    if UI_ENV_FILE.exists():
        load_dotenv(UI_ENV_FILE, override=False)
        print(f"✓ Loaded credentials from ui/.env.local (primary)")

    if ENV_FILE.exists():
        load_dotenv(ENV_FILE, override=True)
        print(f"✓ Applied overrides from {ENV_FILE.name}")

    # Bridge key-name difference: UI uses ELASTICSEARCH_URL, notebooks use ELASTIC_URL
    if not os.getenv("ELASTIC_URL") and not os.getenv("ELASTIC_CLOUD_ID"):
        ui_url = os.getenv("ELASTICSEARCH_URL")
        if ui_url:
            os.environ["ELASTIC_URL"] = ui_url
    
    credentials = {}
    needs_save = False
    
    # --- Elastic Credentials ---
    if require_elastic:
        # Check for URL first (Serverless), then Cloud ID (traditional Cloud)
        elastic_url = os.getenv("ELASTIC_URL")
        cloud_id = os.getenv("ELASTIC_CLOUD_ID")
        
        if not elastic_url and not cloud_id:
            print("\n─── Elastic Credentials ───")
            print("Enter your Elasticsearch endpoint.")
            print("  - For Serverless: paste the full URL (https://...elastic.cloud:443)")
            print("  - For Cloud: paste your Cloud ID")
            endpoint = getpass.getpass("Elastic URL or Cloud ID: ")
            
            # Detect if it's a URL or Cloud ID
            if endpoint.startswith("http"):
                elastic_url = endpoint
            else:
                cloud_id = endpoint
            needs_save = True
        
        if elastic_url:
            credentials["ELASTIC_URL"] = elastic_url
        if cloud_id:
            credentials["ELASTIC_CLOUD_ID"] = cloud_id
        
        # API Key
        api_key = os.getenv("ELASTIC_API_KEY")
        if not api_key:
            api_key = getpass.getpass("Enter your Elastic API Key: ")
            needs_save = True
        credentials["ELASTIC_API_KEY"] = api_key
    
    # --- Jina Credentials ---
    if require_jina:
        jina_key = os.getenv("JINA_API_KEY")
        if not jina_key:
            print("\n─── Jina AI Credentials ───")
            jina_key = getpass.getpass("Enter your Jina API Key: ")
            needs_save = True
        credentials["JINA_API_KEY"] = jina_key
    
    # --- User Suffix for unique index names ---
    user_suffix = os.getenv("USER_SUFFIX")
    if not user_suffix:
        user_suffix = _get_user_suffix()
        needs_save = True
    credentials["USER_SUFFIX"] = user_suffix
    
    # --- Offer to save ---
    if needs_save and save_prompt:
        print("\n" + "─" * 40)
        save = input("Save credentials to .env for future sessions? [y/N]: ").strip().lower()
        if save == 'y':
            _save_to_env(credentials)
            print(f"✓ Credentials saved to {ENV_FILE.name}")
            print("  (This file is gitignored and won't be committed)")
    
    # Set in environment for this session
    for key, value in credentials.items():
        os.environ[key] = value
    
    return credentials


def _save_to_env(credentials: dict) -> None:
    """Save credentials to the project-root .env file."""
    lines = [
        "# Innocenti Risk Management - Notebook Credentials",
        "# Auto-generated. This file is gitignored.",
        "#",
        "# NOTE: The primary credential source is ui/.env.local.",
        "# Values here override ui/.env.local for notebook runs only.",
        "",
    ]
    
    if "ELASTIC_URL" in credentials:
        lines.append(f"ELASTIC_URL={credentials['ELASTIC_URL']}")
    if "ELASTIC_CLOUD_ID" in credentials:
        lines.append(f"ELASTIC_CLOUD_ID={credentials['ELASTIC_CLOUD_ID']}")
    if "ELASTIC_API_KEY" in credentials:
        lines.append(f"ELASTIC_API_KEY={credentials['ELASTIC_API_KEY']}")
    if "JINA_API_KEY" in credentials:
        lines.append(f"JINA_API_KEY={credentials['JINA_API_KEY']}")
    if "USER_SUFFIX" in credentials:
        lines.append(f"USER_SUFFIX={credentials['USER_SUFFIX']}")
    
    lines.append("")  # Trailing newline
    
    with open(ENV_FILE, 'w') as f:
        f.write('\n'.join(lines))


def get_index_name(base_name: str = "search-eu-ai-act") -> str:
    """
    Generate a unique index name using the user suffix.
    
    Example: "search-eu-ai-act" -> "search-eu-ai-act-jdoe"
    
    Args:
        base_name: The base index name
    
    Returns:
        Index name with user suffix appended
    """
    suffix = os.getenv("USER_SUFFIX") or _get_user_suffix()
    return f"{base_name}-{suffix}"


def get_inference_id(model_type: str) -> str:
    """
    Generate a unique inference endpoint ID using the user suffix.
    
    Args:
        model_type: Either "embeddings" or "reranker"
    
    Returns:
        Inference ID with user suffix appended
    
    Example: "embeddings" -> ".jina-embeddings-v5-text-small"
    """
    suffix = os.getenv("USER_SUFFIX") or _get_user_suffix()
    
    if model_type == "embeddings":
        return ".jina-embeddings-v5-text-small"
    elif model_type == "reranker":
        return f"jina-reranker-v3-{suffix}"
    else:
        raise ValueError(f"Unknown model_type: {model_type}. Use 'embeddings' or 'reranker'.")


def get_elasticsearch_client(credentials: dict):
    """
    Create an Elasticsearch client from credentials.
    
    Handles both:
    - Elastic Cloud (uses cloud_id parameter)
    - Elastic Serverless (uses hosts parameter with URL)
    
    Args:
        credentials: Dict from get_credentials() containing ELASTIC_URL or ELASTIC_CLOUD_ID
    
    Returns:
        Elasticsearch client instance
    """
    from elasticsearch import Elasticsearch
    
    api_key = credentials.get("ELASTIC_API_KEY")
    
    if "ELASTIC_URL" in credentials:
        # Serverless - use URL
        return Elasticsearch(
            hosts=[credentials["ELASTIC_URL"]],
            api_key=api_key
        )
    elif "ELASTIC_CLOUD_ID" in credentials:
        # Traditional Cloud - use cloud_id
        return Elasticsearch(
            cloud_id=credentials["ELASTIC_CLOUD_ID"],
            api_key=api_key
        )
    else:
        raise ValueError("No ELASTIC_URL or ELASTIC_CLOUD_ID found in credentials")


# Convenience function for quick setup
def setup_notebook(require_elastic: bool = True, require_jina: bool = True) -> dict:
    """
    One-liner setup for notebooks. Returns credentials and prints useful info.
    
    Usage:
        from utils.credentials import setup_notebook
        creds = setup_notebook()
    """
    print("=" * 50)
    print("  Innocenti Risk Management - Notebook Setup")
    print("=" * 50)
    
    creds = get_credentials(
        require_elastic=require_elastic,
        require_jina=require_jina
    )
    
    print("\n" + "─" * 50)
    print(f"  User Suffix:     {creds.get('USER_SUFFIX', 'N/A')}")
    print(f"  Index Name:      {get_index_name()}")
    print(f"  Embedding Model: {get_inference_id('embeddings')}")
    print(f"  Reranker Model:  {get_inference_id('reranker')}")
    print("─" * 50 + "\n")
    
    return creds
