# ADR-005: Use Amazon Bedrock for Managed RAG & Guardrails

## Status
Accepted

## Context
Building generative AI features requires selecting model providers and vector search orchestration.

## Decision
We use **Amazon Bedrock** (Claude 3.5 Sonnet/Haiku), **Bedrock Knowledge Bases**, and **Bedrock Guardrails**.

## Rationale
- Managed Bedrock Knowledge Bases handle document chunking, embedding generation, and vector retrieval without maintaining custom Pinecone/Weaviate clusters.
- Bedrock Guardrails enforce strict enterprise safety policies (redacting PII, preventing off-topic advice, and stopping prompt injection attacks).
- Keeps data within AWS security boundaries without exposing sensitive customer order details to public API endpoints.
