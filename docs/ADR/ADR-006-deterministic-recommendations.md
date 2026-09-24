# ADR-006: Hybrid Recommendation Engine (Deterministic Ranking + AI Explanation)

## Status
Accepted

## Context
Relying entirely on LLMs to generate product recommendation lists leads to hallucinated SKUs, out-of-stock items, unpredictable pricing, and high latency.

## Decision
We separate **Candidate Generation & Ranking** (deterministic SQL/Vector queries) from **Explanation** (LLM text synthesis).

## Rationale
- E-commerce recommendations must strictly guarantee that returned items exist, are in-stock, and match user permissions.
- SQL candidate generation ensures 100% accurate catalog constraints while Bedrock provides contextual "Why you might like this" sentences.
