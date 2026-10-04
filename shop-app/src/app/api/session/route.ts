import {
  createSession,
  deleteSession,
  errorResponse,
  jsonResponse,
  readJson,
} from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const cookie = await createSession(request, await readJson(request, 1024));
    return jsonResponse({ ok: true }, 200, { "Set-Cookie": cookie });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    return jsonResponse({ ok: true }, 200, {
      "Set-Cookie": await deleteSession(request),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
