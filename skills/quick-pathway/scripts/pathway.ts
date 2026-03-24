import { z } from "zod";
import { api, output, outputData, fail, parseArgs } from "../../../lib/client.js";

// --- Schemas ---

const NodeSchema = z.object({
  id: z.string().min(1, "Node must have 'id'"),
  type: z.enum(["input", "output"]).default("input"),
  data: z.object({
    type: z.enum(["start", "prompt", "end", "goto"], {
      message: "data.type must be start|prompt|end|goto",
    }),
    title: z.string().optional(),
    prompt: z.string().optional(),
    tools: z.array(z.string()).optional(),
    variableKeys: z.array(z.string()).optional(),
    isGlobalNode: z.boolean().optional(),
    globalNodeReason: z.string().optional(),
    knowledgeBaseId: z.string().optional(),
    referenceNodeId: z.string().nullable().optional(),
  }),
  position: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 }),
});

const EdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string().min(1, "Edge must have 'source'"),
  target: z.string().min(1, "Edge must have 'target'"),
  condition: z.string().optional(),
});

const BatchSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema).default([]),
});

const ReplaceSchema = z.object({
  nodes: z.array(z.record(z.unknown())),
  edges: z.array(z.record(z.unknown())).default([]),
  version: z.string().optional(),
});

// --- Helpers ---

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    fail("Invalid JSON");
  }
}

function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    fail(
      `Validation error:\n${result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`,
    );
  }
  return result.data;
}

// --- Actions ---

async function getPathway(projectId: string) {
  const result = await api<{
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
    version?: string;
  }>("GET", `/projects/${projectId}/pathway`);

  if (!result.ok) output(result);

  const { nodes, edges, version } = result.data;
  outputData({
    nodeCount: nodes.length,
    edgeCount: edges.length,
    version,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.data as Record<string, unknown>)?.type,
      title:
        (n.data as Record<string, unknown>)?.title ??
        (n.data as Record<string, unknown>)?.label ??
        "untitled",
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      condition: (e.data as Record<string, unknown>)?.condition,
    })),
  });
}

async function addNode(projectId: string, json: string) {
  const data = validate(NodeSchema, parseJson(json));
  const result = await api("POST", `/projects/${projectId}/pathway/nodes`, data);
  output(result);
}

async function addEdge(projectId: string, json: string) {
  const data = validate(EdgeSchema, parseJson(json));
  const result = await api("POST", `/projects/${projectId}/pathway/edges`, data);
  output(result);
}

async function updateNode(projectId: string, nodeId: string, json: string) {
  const data = parseJson(json);
  const result = await api(
    "PATCH",
    `/projects/${projectId}/pathway/nodes/${nodeId}`,
    data,
  );
  output(result);
}

async function deleteNode(projectId: string, nodeId: string) {
  const result = await api(
    "DELETE",
    `/projects/${projectId}/pathway/nodes/${nodeId}`,
  );
  output(result);
}

async function deleteEdge(projectId: string, edgeId: string) {
  const result = await api(
    "DELETE",
    `/projects/${projectId}/pathway/edges/${edgeId}`,
  );
  output(result);
}

async function replaceFull(projectId: string, json: string) {
  const data = validate(ReplaceSchema, parseJson(json));
  const result = await api("PUT", `/projects/${projectId}/pathway`, data);
  output(result);
}

async function batchSetup(projectId: string, json: string) {
  const { nodes, edges } = validate(BatchSchema, parseJson(json));

  console.log(`Setting up pathway sequentially...`);

  for (const node of nodes) {
    const result = await api(
      "POST",
      `/projects/${projectId}/pathway/nodes`,
      node,
    );
    if (!result.ok) {
      fail(`Failed adding node "${node.id}": ${(result as { error: string }).error}`);
    }
    console.log(`  + node: ${node.id}`);
  }

  for (const edge of edges) {
    const result = await api(
      "POST",
      `/projects/${projectId}/pathway/edges`,
      edge,
    );
    if (!result.ok) {
      fail(`Failed adding edge ${edge.source}→${edge.target}: ${(result as { error: string }).error}`);
    }
    console.log(`  + edge: ${edge.source} → ${edge.target}`);
  }

  console.log(`Done: ${nodes.length} nodes, ${edges.length} edges`);
  process.exit(0);
}

async function getVersion(projectId: string) {
  const result = await api("GET", `/projects/${projectId}/pathway/version`);
  output(result);
}

async function listVersions(projectId: string) {
  const result = await api("GET", `/projects/${projectId}/pathway/versions`);
  output(result);
}

async function rollback(projectId: string, version: string) {
  const ver = Number.parseInt(version, 10);
  if (Number.isNaN(ver)) fail("Version must be a number");
  const result = await api("POST", `/projects/${projectId}/pathway/rollback`, {
    targetVersion: ver,
  });
  output(result);
}

// --- CLI ---

const { action, args } = parseArgs();

switch (action) {
  case "get":
    if (!args[0]) fail("Usage: pathway.ts get <projectId>");
    await getPathway(args[0]);
    break;
  case "get-node": {
    if (!args[0] || !args[1]) fail("Usage: pathway.ts get-node <projectId> <nodeId>");
    const result = await api("GET", `/projects/${args[0]}/pathway/nodes/${args[1]}`);
    output(result);
    break;
  }
  case "add-node":
    if (!args[0] || !args[1]) fail("Usage: pathway.ts add-node <projectId> '<json>'");
    await addNode(args[0], args[1]);
    break;
  case "add-edge":
    if (!args[0] || !args[1]) fail("Usage: pathway.ts add-edge <projectId> '<json>'");
    await addEdge(args[0], args[1]);
    break;
  case "update-node":
    if (!args[0] || !args[1] || !args[2])
      fail("Usage: pathway.ts update-node <projectId> <nodeId> '<json>'");
    await updateNode(args[0], args[1], args[2]);
    break;
  case "delete-node":
    if (!args[0] || !args[1]) fail("Usage: pathway.ts delete-node <projectId> <nodeId>");
    await deleteNode(args[0], args[1]);
    break;
  case "delete-edge":
    if (!args[0] || !args[1]) fail("Usage: pathway.ts delete-edge <projectId> <edgeId>");
    await deleteEdge(args[0], args[1]);
    break;
  case "replace":
    if (!args[0] || !args[1]) fail("Usage: pathway.ts replace <projectId> '<json>'");
    await replaceFull(args[0], args[1]);
    break;
  case "batch-setup":
    if (!args[0] || !args[1]) fail("Usage: pathway.ts batch-setup <projectId> '<json>'");
    await batchSetup(args[0], args[1]);
    break;
  case "version":
    if (!args[0]) fail("Usage: pathway.ts version <projectId>");
    await getVersion(args[0]);
    break;
  case "versions":
    if (!args[0]) fail("Usage: pathway.ts versions <projectId>");
    await listVersions(args[0]);
    break;
  case "rollback":
    if (!args[0] || !args[1]) fail("Usage: pathway.ts rollback <projectId> <version>");
    await rollback(args[0], args[1]);
    break;
  default:
    console.log(`Usage: pathway.ts <action> <projectId> [args...]

  get <id>                          Compact pathway overview
  get-node <id> <nodeId>            Full node details
  add-node <id> <json>              Create node (zod-validated)
  add-edge <id> <json>              Create edge (zod-validated)
  update-node <id> <nodeId> <json>  Partial update node
  delete-node <id> <nodeId>         Delete node + connected edges
  delete-edge <id> <edgeId>         Delete edge
  replace <id> <json>               Replace entire pathway
  batch-setup <id> <json>           Add nodes+edges sequentially (safe)
  version <id>                      Current version info
  versions <id>                     Version history
  rollback <id> <version>           Rollback to version`);
    process.exit(1);
}
