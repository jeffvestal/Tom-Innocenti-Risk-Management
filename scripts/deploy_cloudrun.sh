#!/bin/bash
# deploy_cloudrun.sh — Deploy Jina training presentation to Google Cloud Run
set -e
export CLOUDSDK_CORE_DISABLE_PROMPTS=1

# ── Configuration ────────────────────────────────────────────
GCP_PROJECT="${GCP_PROJECT:-elastic-customer-eng}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="jina-training"
SITE_DIR="docs/presentation"
MEMORY="256Mi"
DISABLE_IAP=false

# ── Parse arguments ───────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)    GCP_PROJECT="$2"; shift 2 ;;
        --project=*)  GCP_PROJECT="${1#*=}"; shift ;;
        --region)     GCP_REGION="$2"; shift 2 ;;
        --region=*)   GCP_REGION="${1#*=}"; shift ;;
        --disable-iap) DISABLE_IAP=true; shift ;;
        -h|--help)
            echo "Usage: $0 [--project ID] [--region REGION] [--disable-iap]"
            exit 0 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
ARTIFACT_REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${SERVICE_NAME}"
TAG="${ARTIFACT_REGISTRY}/site:latest"

echo "=== Deploying ${SERVICE_NAME} to Cloud Run ==="
echo "Project: ${GCP_PROJECT} | Region: ${GCP_REGION} | IAP: $([ "$DISABLE_IAP" = true ] && echo 'off' || echo 'on')"

# ── Prerequisites ─────────────────────────────────────────────
gcloud config set project "$GCP_PROJECT" --quiet

# Ensure Artifact Registry repo exists
if ! gcloud artifacts repositories describe "$SERVICE_NAME" \
    --location="$GCP_REGION" --project="$GCP_PROJECT" &>/dev/null; then
    gcloud artifacts repositories create "$SERVICE_NAME" \
        --repository-format=docker \
        --location="$GCP_REGION" \
        --project="$GCP_PROJECT" \
        --description="${SERVICE_NAME} container images" \
        --quiet
    echo "Created Artifact Registry repo: ${SERVICE_NAME}"
fi

gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

# ── Build & Push ──────────────────────────────────────────────
docker build --platform linux/amd64 \
    -t "$TAG" \
    -f "${REPO_ROOT}/${SITE_DIR}/Dockerfile" \
    "${REPO_ROOT}/${SITE_DIR}"
docker push "$TAG"
echo "Pushed: ${TAG}"

# ── Deploy to Cloud Run ──────────────────────────────────────
AUTH_FLAG="--no-allow-unauthenticated"
[ "$DISABLE_IAP" = true ] && AUTH_FLAG="--allow-unauthenticated"

gcloud run deploy "$SERVICE_NAME" \
    --image="$TAG" \
    --region="$GCP_REGION" \
    --project="$GCP_PROJECT" \
    --platform=managed \
    $AUTH_FLAG \
    --port=8080 \
    --memory="$MEMORY" \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --quiet

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$GCP_REGION" --format='value(status.url)')
echo "Deployed: ${SERVICE_URL}"

# ── IAP Setup ─────────────────────────────────────────────────
if [ "$DISABLE_IAP" = false ]; then
    echo "Enabling IAP for @elastic.co SSO..."

    gcloud services enable iap.googleapis.com --project="$GCP_PROJECT" --quiet

    gcloud beta run services update "$SERVICE_NAME" \
        --region="$GCP_REGION" --iap --quiet

    PROJECT_NUMBER=$(gcloud projects describe "$GCP_PROJECT" --format='value(projectNumber)')

    gcloud beta services identity create \
        --service=iap.googleapis.com \
        --project="$GCP_PROJECT" 2>/dev/null || true

    gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
        --region="$GCP_REGION" \
        --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-iap.iam.gserviceaccount.com" \
        --role="roles/run.invoker" --quiet

    gcloud beta iap web add-iam-policy-binding \
        --member='domain:elastic.co' \
        --role='roles/iap.httpsResourceAccessor' \
        --region="$GCP_REGION" \
        --resource-type=cloud-run \
        --service="$SERVICE_NAME" --quiet

    echo "IAP enabled: @elastic.co users can access via Google SSO"
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "=== Deployment Complete ==="
echo "URL: ${SERVICE_URL}"
echo ""
echo "Teardown: gcloud run services delete ${SERVICE_NAME} --region=${GCP_REGION} --quiet"
