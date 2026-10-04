import {
  requireSession,
  requireWorkspace,
  errorResponse,
  jsonResponse,
} from "../../../lib/auth";
import { voiceAvailability } from "../../../lib/voice-server";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    requireWorkspace(request, session);
    const availability = voiceAvailability();
    if (session.mode !== "owner" || session.workspace !== "shop")
      return jsonResponse({
        ...availability,
        available: false,
        reason:
          "Paid voice requires configured owner sign-in. Synthetic preview cannot use the provider key or budget.",
      });
    return jsonResponse(availability);
  } catch (error) {
    return errorResponse(error);
  }
}
