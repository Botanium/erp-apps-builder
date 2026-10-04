import {
  errorResponse,
  jsonResponse,
  requireSession,
  requireWorkspace,
} from "@/lib/auth";
import { readConversation } from "@/lib/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    if (request.headers.has("x-shop-workspace"))
      requireWorkspace(request, session);
    return jsonResponse({
      messages: await readConversation(session.workspace),
      workspace: session.workspace,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
