import { z } from "zod";
import { api, output, outputData, fail, parseArgs } from "../../../lib/client.js";

// --- Schemas ---

const UpdateAgentSchema = z
  .object({
    name: z.string().min(1).max(128).optional(),
    type: z.enum(["monolithic", "skill"]).optional(),
    status: z.enum(["draft", "published"]).optional(),
    globalPrompt: z.string().nullable().optional(),
    executionMode: z.enum(["smart", "turbo", "balance"]).nullable().optional(),
    timezone: z.string().nullable().optional(),
    memoryEnabled: z.boolean().optional(),
    beforeStartConfig: z.record(z.unknown()).nullable().optional(),
    postSessionWebhook: z.record(z.unknown()).nullable().optional(),
    postSessionVariableKeys: z.array(z.string()).nullable().optional(),
    postEvaluationConfig: z.record(z.unknown()).nullable().optional(),
    placeholderMessages: z.record(z.unknown()).nullable().optional(),
    variableConfigs: z.array(z.record(z.unknown())).nullable().optional(),
  })
  .strict();

// --- Actions ---

async function getAgent(projectId: string) {
  const result = await api("GET", `/projects/${projectId}/agent`);
  output(result);
}

async function getWithOverview(projectId: string) {
  const [agentRes, pathwayRes, toolsRes] = await Promise.all([
    api<Record<string, unknown>>("GET", `/projects/${projectId}/agent`),
    api<{ nodes: unknown[]; edges: unknown[]; version?: string }>(
      "GET",
      `/projects/${projectId}/pathway`,
    ),
    api<Array<{ id: string; type: string; name: string; description: string }>>(
      "GET",
      `/projects/${projectId}/tools`,
    ),
  ]);

  if (!agentRes.ok) output(agentRes);
  if (!pathwayRes.ok) output(pathwayRes);
  if (!toolsRes.ok) output(toolsRes);

  const pathway = pathwayRes.data;
  outputData({
    agent: agentRes.data,
    pathway: {
      nodeCount: pathway.nodes.length,
      edgeCount: pathway.edges.length,
      version: pathway.version,
      nodes: pathway.nodes.map((n: Record<string, unknown>) => ({
        id: n.id,
        type: (n.data as Record<string, unknown>)?.type,
        title:
          (n.data as Record<string, unknown>)?.title ??
          (n.data as Record<string, unknown>)?.label,
      })),
      edges: pathway.edges.map((e: Record<string, unknown>) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        condition: (e.data as Record<string, unknown>)?.condition,
      })),
    },
    tools: toolsRes.data.map((t) => ({
      id: t.id,
      type: t.type,
      name: t.name,
      description: t.description,
    })),
  });
}

async function getPrompt(projectId: string) {
  const result = await api<{ globalPrompt?: string | null }>(
    "GET",
    `/projects/${projectId}/agent`,
  );
  if (!result.ok) output(result);
  console.log(result.data.globalPrompt ?? "No prompt set");
  process.exit(0);
}

async function updateAgent(projectId: string, jsonBody: string) {
  let body: unknown;
  try {
    body = JSON.parse(jsonBody);
  } catch {
    fail("Invalid JSON body");
  }

  const parsed = UpdateAgentSchema.safeParse(body);
  if (!parsed.success) {
    fail(
      `Validation error:\n${parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`,
    );
  }

  const result = await api("PUT", `/projects/${projectId}/agent`, parsed.data);
  output(result);
}

// --- CLI ---

const { action, args } = parseArgs();

switch (action) {
  case "get": {
    const pid = args[0];
    if (!pid) fail("Usage: agent.ts get <projectId>");
    await getAgent(pid);
    break;
  }
  case "overview": {
    const pid = args[0];
    if (!pid) fail("Usage: agent.ts overview <projectId>");
    await getWithOverview(pid);
    break;
  }
  case "get-prompt": {
    const pid = args[0];
    if (!pid) fail("Usage: agent.ts get-prompt <projectId>");
    await getPrompt(pid);
    break;
  }
  case "update": {
    const pid = args[0];
    const body = args[1];
    if (!pid || !body) fail("Usage: agent.ts update <projectId> '<json>'");
    await updateAgent(pid, body);
    break;
  }
  default:
    console.log(`Usage: agent.ts <action> <projectId> [args...]

  get <id>               Full agent configuration
  overview <id>          Agent + pathway overview + tools list
  get-prompt <id>        System prompt text only
  update <id> <json>     Update agent (zod-validated)`);
    process.exit(1);
}
