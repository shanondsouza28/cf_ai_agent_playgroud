import { routeAgentRequest, type Schedule } from "agents";
import { getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "@cloudflare/ai-chat";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";

/** Env type documents the bindings available to the Worker */
export type Env = {
  AI: any; // Workers AI binding
  // other bindings e.g. Chat?: DurableObjectNamespace;
};

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    // Collect all tools, including MCP tools — guarded because MCP may not be ready in dev
    let mcpTools: Record<string, any> = {};
    try {
      if (this.mcp && typeof (this.mcp as any).getAITools === "function") {
        // getAITools can throw if its json/schema isn't initialized yet (dev)
        mcpTools = (this.mcp as any).getAITools() ?? {};
      }
    } catch (err) {
      // Log a concise warning but continue — we still want agent to operate using local tools
      console.warn("MCP tools unavailable (continuing without MCP tools):", String(err));
    }

    const allTools = {
      ...tools,
      ...mcpTools
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        // Create the Workers AI provider using the binding exposed on globalThis
        const workersai = createWorkersAI({ binding: (globalThis as any).AI });
        // Create a model handle for Llama 3.3 (pick the exact model id your account supports)
        const modelHandle = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast" as any);

        const result = streamText({
          system: `You are a helpful assistant that can do various tasks... 

${getSchedulePrompt({ date: new Date() })}

If the user asks to schedule a task, use the schedule tool to schedule the task.
`,
          messages: await convertToModelMessages(processedMessages),
          model: modelHandle,
          tools: allTools,
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<typeof allTools>,
          stopWhen: stepCountIs(10),
          abortSignal: options?.abortSignal
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }

  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      }
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    // Expose the Workers AI binding globally so deeper code can access it.
    (globalThis as any).AI = env.AI;

    const url = new URL(request.url);

    // Keep /check-open-ai-key compatible with UI expectations
    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!env.OPENAI_API_KEY;
      const hasWorkersAI = !!env.AI;
      const success = hasOpenAIKey || hasWorkersAI;
      const provider = hasWorkersAI ? "workers-ai" : hasOpenAIKey ? "openai" : null;
      return new Response(JSON.stringify({ success, provider }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Route to the agents router (UI endpoints + chat agent API)
    return (await routeAgentRequest(request, env)) || new Response("Not found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;