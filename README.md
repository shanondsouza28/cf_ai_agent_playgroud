# cf_ai_agent_playgroud


An AI-powered chat agent built on **Cloudflare Agents** using **Llama 3.3 on Workers AI**.  
This project demonstrates agent orchestration, tool execution, and stateful interactions on Cloudflare’s platform.

This application was built as part of a Cloudflare take-home assignment.

---

## Overview

The application provides a chat-based interface where users can interact with an AI agent that can:
- Answer general questions
- Call external tools (e.g. live weather data)
- Maintain conversational context across turns

The goal of this project is to showcase how to build an AI-powered application using Cloudflare’s **Workers AI**, **Agents**, and **Workers** runtime.

---

## Architecture & Components

### LLM
- **Model**: Llama 3.3  
- **Provider**: Cloudflare Workers AI  
- **Model ID**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

The agent uses Workers AI directly. No external LLM API keys are required.

---

### Workflow / Coordination
- **Cloudflare Workers** handle request routing and execution
- **Cloudflare Agents** manage:
  - Tool calling
  - Multi-step reasoning
  - Streaming responses
- Tool execution (e.g. weather lookup) is coordinated by the agent runtime

This satisfies the workflow/coordination requirement using Workers and the Agents framework.

---

### User Input
- **Chat-based UI** implemented with React
- Streaming responses via the Agents SDK
- Local development uses Vite for the UI and Wrangler for the Worker

> Voice input is not implemented; chat input is used as recommended.

---

### Memory / State
- Conversational state is maintained by the agent across turns
- Tool outputs influence subsequent responses
- State is handled within the agent lifecycle and Worker runtime

---

## Tooling Example: Weather Tool

The agent includes a `getWeatherInformation` tool that:
- Accepts a city name or coordinates
- Uses OpenStreetMap (Nominatim) for geocoding
- Fetches live weather data from Open-Meteo
- Returns structured results to the agent

This demonstrates real API integration and agent tool execution.

---

## Running Locally

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Install dependencies
```bash
npm install --legacy-peer-deps
```
#Start the application

Terminal 1 – Worker
```
npx wrangler dev
```
Terminal 2 – UI
```
npm start
```
Open the app

The UI will be available at the URL printed by Vite (typically):

http://localhost:5173

The Worker runs locally at:

http://localhost:8787
Configuration Notes

No OpenAI API key is required

Workers AI authentication is handled automatically via Cloudflare bindings

.dev.vars is used only for local development configuration

AI Prompts

All system prompts and tool-related prompts used in this project are documented in PROMPTS.md, as required.

Attribution

This project is based on Cloudflare’s official agents-starter template and has been extended with:

Workers AI (Llama 3.3)

Custom tools

Agent orchestration logic

Application-specific behavior

All additional code and logic are original.
