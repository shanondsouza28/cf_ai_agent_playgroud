# PROMPTS.md

This file documents the prompts used while building this project.

AI-assisted coding was used during development to help understand the Cloudflare platform,
debug issues, and design agent behavior. All final code decisions and implementations
were written and integrated manually.

---

## AI-Assisted Development Prompts

Examples of prompts used during development:

- "Help me replace OpenAI usage with Cloudflare Workers AI using Llama 3.3."
- "Why is my Cloudflare Agent throwing a 'jsonSchema not initialized' error?"
- "How should tools be structured for a Cloudflare Agent running in a Worker?"

These prompts were used to reason about architecture, platform behavior, and debugging.

---

## Notes

- No chain-of-thought or private reasoning is stored or logged.
- Prompts are intentionally simple and focused.
- Workers AI authentication is handled via Cloudflare bindings; no external API keys are required.
