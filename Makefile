# ─── Notebook Tests ───────────────────────────────────────
# Unit tests only (fast, no external services)
test-nb-unit:
	python -m pytest notebooks/tests/test_credentials.py notebooks/tests/test_parsing.py notebooks/tests/test_inference.py notebooks/tests/test_reader.py -v

# Smoke tests (mocked services, verifies notebooks execute)
test-nb-smoke:
	python -m pytest notebooks/tests/test_notebooks_smoke.py -v --timeout=120

# Integration tests (requires credentials in ui/.env.local or .env)
# Must opt-in with -m integration since they hit real services
test-nb-integration:
	python -m pytest notebooks/tests/test_notebooks_integration.py -v -m integration -o "addopts=" --timeout=600

# All notebook tests (unit + smoke, excludes integration by default)
test-nb-all:
	python -m pytest notebooks/tests/ -v --timeout=120

# ─── UI Tests ────────────────────────────────────────────
test-ui-unit:
	cd ui && npm run test

test-ui-e2e:
	cd ui && npm run test:e2e

test-ui-all:
	cd ui && npm run test:all

# ─── Everything ──────────────────────────────────────────
test-all: test-nb-all test-ui-all

.PHONY: test-nb-unit test-nb-smoke test-nb-integration test-nb-all \
        test-ui-unit test-ui-e2e test-ui-all test-all
