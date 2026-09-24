# ADR-007: Statistical Inventory Forecasting with LLM Synthesis

## Status
Accepted

## Context
Sellers need inventory replenishment advice. Asking an LLM to guess sales velocity produces ungrounded numbers.

## Decision
Inventory forecasts use **Holt-Winters exponential smoothing / moving averages** in code, with **Bedrock synthesizing executive summaries**.

## Rationale
- Mathematical time-series models handle seasonality and trend velocity accurately.
- LLM translates calculated metrics (e.g. `days_remaining: 4.2`, `reorder_point: 120`) into plain-English seller recommendations.
