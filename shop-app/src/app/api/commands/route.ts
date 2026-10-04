import {
  errorResponse,
  jsonResponse,
  readJson,
  requireSameOrigin,
  requireSession,
  requireWorkspace,
} from "@/lib/auth";
import type { Command } from "@/lib/domain";
import { executeCommand } from "@/lib/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireSameOrigin(request);
    requireWorkspace(request, session);
    const command = await readJson(request);
    return jsonResponse({
      state: await executeCommand(
        command as Command,
        session.actor,
        session.workspace
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
