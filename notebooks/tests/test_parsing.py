"""Unit tests for parsing and comparison utilities."""

import pandas as pd
import pytest

from utils.parsing import parse_articles
from utils.comparison import build_comparison


class TestParseArticles:
    def test_parses_expected_count(self, sample_markdown):
        articles = parse_articles(sample_markdown)
        assert len(articles) == 3

    def test_article_ids(self, sample_markdown):
        articles = parse_articles(sample_markdown)
        ids = [a["id"] for a in articles]
        assert ids == ["en_art_1", "en_art_5", "en_art_6"]

    def test_article_numbers(self, sample_markdown):
        articles = parse_articles(sample_markdown)
        nums = [a["article_number"] for a in articles]
        assert nums == ["1", "5", "6"]

    def test_titles_extracted(self, sample_markdown):
        articles = parse_articles(sample_markdown)
        assert articles[0]["title"] == "Subject matter"
        assert articles[1]["title"] == "Prohibited artificial intelligence practices"
        assert articles[2]["title"] == "Classification rules for high-risk AI systems"

    def test_body_text_not_empty(self, sample_markdown):
        articles = parse_articles(sample_markdown)
        for art in articles:
            assert len(art["text"]) > 50

    def test_language_is_english(self, sample_markdown):
        articles = parse_articles(sample_markdown)
        for art in articles:
            assert art["language"] == "en"

    def test_urls_contain_article_number(self, sample_markdown):
        articles = parse_articles(sample_markdown)
        for art in articles:
            assert f"#Art{art['article_number']}" in art["url"]

    def test_preamble_skipped(self, sample_markdown):
        articles = parse_articles(sample_markdown)
        texts = " ".join(a["text"] for a in articles)
        assert "Preamble text that should be skipped" not in texts

    def test_empty_input(self):
        assert parse_articles("") == []

    def test_no_articles(self):
        assert parse_articles("Just some random text with no articles.") == []

    def test_article_with_no_body(self):
        md = "## Article 99\nTitle Only\n"
        assert parse_articles(md) == []

    def test_collapses_multiple_newlines(self):
        md = "Article 42\nTest Title\n\nSome body.\n\n\n\n\nMore body."
        articles = parse_articles(md)
        assert len(articles) == 1
        assert "\n\n\n" not in articles[0]["text"]


class TestBuildComparison:
    def test_basic_comparison(self, make_es_hit):
        naive = [
            make_es_hit("1", "Article 1", 10.0),
            make_es_hit("5", "Article 5", 9.0),
            make_es_hit("6", "Article 6", 8.0),
        ]
        reranked = [
            make_es_hit("5", "Article 5", 0.95),
            make_es_hit("1", "Article 1", 0.90),
            make_es_hit("6", "Article 6", 0.85),
        ]
        df = build_comparison(naive, reranked)

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 3
        assert list(df.columns) == ["Reranked", "Article", "Title", "Was Rank", "Movement"]

    def test_moved_up(self, make_es_hit):
        naive = [make_es_hit("1", "A1"), make_es_hit("5", "A5")]
        reranked = [make_es_hit("5", "A5"), make_es_hit("1", "A1")]
        df = build_comparison(naive, reranked)
        assert df.iloc[0]["Movement"] == "↑1"

    def test_moved_down(self, make_es_hit):
        naive = [make_es_hit("1", "A1"), make_es_hit("5", "A5")]
        reranked = [make_es_hit("5", "A5"), make_es_hit("1", "A1")]
        df = build_comparison(naive, reranked)
        assert df.iloc[1]["Movement"] == "↓1"

    def test_same_position(self, make_es_hit):
        naive = [make_es_hit("1", "A1")]
        reranked = [make_es_hit("1", "A1")]
        df = build_comparison(naive, reranked)
        assert df.iloc[0]["Movement"] == "="

    def test_new_entry(self, make_es_hit):
        naive = [make_es_hit("1", "A1")]
        reranked = [make_es_hit("99", "A99")]
        df = build_comparison(naive, reranked)
        assert df.iloc[0]["Movement"] == "NEW"
        assert df.iloc[0]["Was Rank"] == ">10"

    def test_title_truncation(self, make_es_hit):
        long_title = "A" * 60
        naive = [make_es_hit("1", long_title)]
        reranked = [make_es_hit("1", long_title)]
        df = build_comparison(naive, reranked)
        assert df.iloc[0]["Title"].endswith("...")
        assert len(df.iloc[0]["Title"]) == 43  # 40 chars + "..."
