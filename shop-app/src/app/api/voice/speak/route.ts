import {
  requireSession,
  requireWorkspace,
  requireSameOrigin,
  errorResponse,
  readJson,
  HttpError,
} from "../../../../lib/auth";
import { configuredBudget } from "../../../../lib/agent";
import { reserveAiBudget } from "../../../../lib/store";
import { requireVoiceConsent, speakVoice } from "../../../../lib/voice-server";

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
    const input = await readJson(request, 8192);
    if (Object.keys(input).length !== 1 || !Object.hasOwn(input, "text"))
      throw new HttpError(400, "Expected only speech text.");
    return await speakVoice(input.text, request, requestId, {
      apiKey: process.env.OPENAI_API_KEY!,
      fetch,
      reserve: (id, amount) => reserveAiBudget(id, amount, configuredBudget()),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
