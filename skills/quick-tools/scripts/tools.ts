import { z } from "zod";
import { api, output, fail, parseArgs } from "../../../lib/client.js";

// --- Schemas ---

const CreateToolSchema = z
  .object({
    type: z.string().min(1, "Tool must have 'type'"),
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough();

const UpdateToolSchema = z
  .object({
    name: z.string().min(1).max(64).optional(),
    description: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    inputSchema: z.record(z.unknown()).optional(),
  })
  .strict();

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

// --- CLI ---

const { action, args } = parseArgs();

switch (action) {
  case "list": {
    if (!args[0]) fail("Usage: tools.ts list <projectId>");
    const result = await api("GET", `/projects/${args[0]}/tools`);
    output(result);
    break;
  }
  case "types": {
    if (!args[0]) fail("Usage: tools.ts types <projectId>");
    const result = await api("GET", `/projects/${args[0]}/tools/types`);
    output(result);
    break;
  }
  case "get": {
    if (!args[0] || !args[1]) fail("Usage: tools.ts get <projectId> <toolId>");
    const result = await api("GET", `/projects/${args[0]}/tools/${args[1]}`);
    output(result);
    break;
  }
  case "create": {
    if (!args[0] || !args[1])
      fail("Usage: tools.ts create <projectId> '<json>'");
    const data = validate(CreateToolSchema, parseJson(args[1]));
    const result = await api("POST", `/projects/${args[0]}/tools`, data);
    output(result);
    break;
  }
  case "update": {
    if (!args[0] || !args[1] || !args[2])
      fail("Usage: tools.ts update <projectId> <toolId> '<json>'");
    const data = validate(UpdateToolSchema, parseJson(args[2]));
    const result = await api(
      "PUT",
      `/projects/${args[0]}/tools/${args[1]}`,
      data,
    );
    output(result);
    break;
  }
  case "delete": {
    if (!args[0] || !args[1])
      fail("Usage: tools.ts delete <projectId> <toolId>");
    const result = await api(
      "DELETE",
      `/projects/${args[0]}/tools/${args[1]}`,
    );
    output(result);
    break;
  }
  default:
    console.log(`Usage: tools.ts <action> <projectId> [args...]

  list <id>                      List all tools
  types <id>                     Available tool types
  get <id> <toolId>              Full tool details
  create <id> <json>             Create tool (zod-validated)
  update <id> <toolId> <json>    Update tool (field-validated)
  delete <id> <toolId>           Delete tool`);
    process.exit(1);
}
