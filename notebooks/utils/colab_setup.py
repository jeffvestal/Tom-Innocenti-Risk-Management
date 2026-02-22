"""
Shared environment setup for Colab and local execution.

Call ``setup_environment()`` at the top of each notebook to handle
Colab detection, repo cloning, and working-directory setup in one line.
"""

import os

REPO_URL = "https://github.com/jeffvestal/Tom-Innocenti-Risk-Management.git"
REPO_NAME = "Tom-Innocenti-Risk-Management"
COLAB_ROOT = "/content"


def setup_environment(packages: str = "") -> bool:
    """Detect runtime environment and configure paths.

    Args:
        packages: Space-separated pip packages to install (e.g.
            ``"requests python-dotenv"``).  Ignored when running locally.

    Returns:
        ``True`` if running in Google Colab, ``False`` otherwise.
    """
    in_colab = "COLAB_GPU" in os.environ or "COLAB_RELEASE_TAG" in os.environ

    if in_colab:
        print("\U0001f4cd Running in Google Colab")
        if packages:
            os.system(f"pip install -q {packages}")

        os.chdir(COLAB_ROOT)
        repo_path = os.path.join(COLAB_ROOT, REPO_NAME)
        if not os.path.exists(repo_path):
            os.system(f"git clone {REPO_URL}")
        else:
            os.system(f"cd {repo_path} && git pull")

        os.chdir(os.path.join(repo_path, "notebooks"))
        print(f"   Working directory: {os.getcwd()}")
    else:
        print("\U0001f4cd Running locally")

    return in_colab
