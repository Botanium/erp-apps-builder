import {
  errorResponse,
  jsonResponse,
  requireSession,
  requireWorkspace,
} from "@/lib/auth";
import { agentCapabilities } from "@/lib/agent";
import { readState } from "@/lib/store";
import { voiceAvailability } from "@/lib/voice-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    if (request.headers.has("x-shop-workspace"))
      requireWorkspace(request, session);
    const capabilities = agentCapabilities();
    return jsonResponse({
      workspace: session.workspace,
      state: await readState(session.workspace),
      capabilities: {
        ...capabilities,
        mode: session.workspace,
        liveAiEnabled: session.mode === "owner" && capabilities.liveAiEnabled,
        voiceAvailable:
          session.mode === "owner" && voiceAvailability().available,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
