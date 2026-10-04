import {
  requireSession,
  requireWorkspace,
  requireSameOrigin,
  errorResponse,
  jsonResponse,
  HttpError,
} from "../../../../lib/auth";
import { configuredBudget } from "../../../../lib/agent";
import { reserveAiBudget } from "../../../../lib/store";
import {
  requireVoiceConsent,
  transcribeVoice,
} from "../../../../lib/voice-server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireSameOrigin(request);
    requireWorkspace(request, session);
    if (session.mode !== "owner" || session.workspace !== "shop")
      throw new HttpError(
        403,
        "Paid voice requires configured owner sign-in. Synthetic preview cannot spend the provider budget.",
        "OWNER_REQUIRED"
      );
    const requestId = requireVoiceConsent(request);
    const text = await transcribeVoice(request, requestId, {
      apiKey: process.env.OPENAI_API_KEY!,
      fetch,
      reserve: (id, amount) => reserveAiBudget(id, amount, configuredBudget()),
    });
    return jsonResponse({ text, mode: "turn-based", submittedToAgent: false });
  } catch (error) {
    return errorResponse(error);
  }
}
