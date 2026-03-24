import { api, output, outputData, fail, parseArgs } from "../../../lib/client.js";

// --- Actions ---

async function listSessions(
  projectId: string,
  page = "1",
  pageSize = "10",
) {
  const result = await api(
    "GET",
    `/projects/${projectId}/sessions?page=${page}&pageSize=${pageSize}`,
  );
  output(result);
}

async function getStats(
  projectId: string,
  startDate?: string,
  endDate?: string,
) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();

  const result = await api(
    "GET",
    `/projects/${projectId}/sessions/stats${qs ? `?${qs}` : ""}`,
  );
  output(result);
}

async function getSession(projectId: string, sessionId: string) {
  const result = await api<Record<string, unknown>>(
    "GET",
    `/projects/${projectId}/sessions/${sessionId}`,
  );
  output(result);
}

async function getSessionCompact(projectId: string, sessionId: string) {
  const result = await api<{
    sessionId: string;
    startTime: string;
    endTime: string | null;
    provider: string | null;
    messageCount: number;
    marked: boolean;
    evaluation: unknown;
    events: Array<{
      type: string;
      timestamp: string;
      data: {
        message?: { role: string; content: string };
      };
    }>;
  }>("GET", `/projects/${projectId}/sessions/${sessionId}`);

  if (!result.ok) output(result);

  const d = result.data;
  const transcript = d.events
    .filter(
      (e) => e.type === "message.sent" || e.type === "message.received",
    )
    .map((e) => ({
      role: e.data.message?.role,
      content:
        (e.data.message?.content?.length ?? 0) > 200
          ? `${e.data.message!.content.slice(0, 200)}...`
          : e.data.message?.content,
      time: e.timestamp,
    }));

  outputData({
    id: d.sessionId,
    start: d.startTime,
    end: d.endTime,
    provider: d.provider,
    messages: d.messageCount,
    marked: d.marked,
    evaluation: d.evaluation,
    transcript,
  });
}

async function searchSessions(projectId: string, query: string) {
  const result = await api(
    "GET",
    `/projects/${projectId}/sessions?search=${encodeURIComponent(query)}&pageSize=10`,
  );
  output(result);
}

// --- CLI ---

const { action, args } = parseArgs();

switch (action) {
  case "list":
    if (!args[0]) fail("Usage: session.ts list <projectId> [page] [pageSize]");
    await listSessions(args[0], args[1], args[2]);
    break;
  case "stats":
    if (!args[0]) fail("Usage: session.ts stats <projectId> [startDate] [endDate]");
    await getStats(args[0], args[1], args[2]);
    break;
  case "get":
    if (!args[0] || !args[1])
      fail("Usage: session.ts get <projectId> <sessionId>");
    await getSession(args[0], args[1]);
    break;
  case "get-compact":
    if (!args[0] || !args[1])
      fail("Usage: session.ts get-compact <projectId> <sessionId>");
    await getSessionCompact(args[0], args[1]);
    break;
  case "search":
    if (!args[0] || !args[1])
      fail("Usage: session.ts search <projectId> <query>");
    await searchSessions(args[0], args[1]);
    break;
  default:
    console.log(`Usage: session.ts <action> <projectId> [args...]

  list <id> [page] [size]        List sessions (paginated)
  stats <id> [start] [end]       Session statistics
  get <id> <sessionId>           Full session with all events
  get-compact <id> <sessionId>   Session with truncated transcript
  search <id> <query>            Search sessions`);
    process.exit(1);
}
