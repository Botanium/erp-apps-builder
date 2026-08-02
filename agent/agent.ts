import { defineAgent } from "eve";
import { mockModel } from "eve/evals";

const asObject = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const parseRequest = (text: string | null): Record<string, unknown> | null => {
  if (text === null) return null;
  try {
    return asObject(JSON.parse(text));
  } catch {
    return null;
  }
};

export default defineAgent({
  model: mockModel({
    modelId: "adaptive-business-os-local-fixture",
    provider: "adaptive-business-os-fixtures",
    respond: ({ lastUserMessage, toolResults }) => {
      const request = parseRequest(lastUserMessage);
      if (!request) {
        return JSON.stringify({
          disposition: "Rejected",
          reason: "The local fixture accepts only a closed JSON request.",
        });
      }

      const adapterRequestIdentity = request.adapterRequestIdentity;
      const completed = [...toolResults]
        .reverse()
        .find(
          (result) =>
            asObject(result.output)?.adapterRequestIdentity ===
            adapterRequestIdentity
        );
      if (completed) return JSON.stringify(completed.output);

      if (request.operation === "start-owner-interview") {
        return {
          toolCalls: [
            {
              id: `tool-call.${String(adapterRequestIdentity)}`,
              name: "start_owner_interview",
              input: {
                adapterRequestIdentity,
                ownerSourceIdentity: request.ownerSourceIdentity,
              },
            },
          ],
        };
      }

      if (request.operation === "answer-owner-interview") {
        return {
          toolCalls: [
            {
              id: `tool-call.${String(adapterRequestIdentity)}`,
              name: "answer_owner_interview",
              input: {
                adapterRequestIdentity,
                ownerInterviewIdentity: request.ownerInterviewIdentity,
                questionIdentity: request.questionIdentity,
                answer: request.answer,
              },
            },
          ],
        };
      }

      if (request.operation === "review-intent-brief") {
        return {
          toolCalls: [
            {
              id: `tool-call.${String(adapterRequestIdentity)}`,
              name: "review_intent_brief",
              input: {
                adapterRequestIdentity,
                ownerInterviewIdentity: request.ownerInterviewIdentity,
                versionIdentity: request.versionIdentity,
              },
            },
          ],
        };
      }

      if (request.operation === "observe-empty-authority") {
        return {
          toolCalls: [
            {
              id: `tool-call.${String(adapterRequestIdentity)}`,
              name: "observe_empty_authority",
              input: { adapterRequestIdentity },
            },
          ],
        };
      }

      if (request.operation === "submit-empty-authority-shell") {
        return {
          toolCalls: [
            {
              id: `tool-call.${String(adapterRequestIdentity)}`,
              name: "submit_kernel_command",
              input: {
                adapterRequestIdentity,
                command: request.command,
              },
            },
          ],
        };
      }

      return JSON.stringify({
        adapterRequestIdentity,
        disposition: "Unsupported",
        operation: request.operation ?? null,
      });
    },
  }),
  modelContextWindowTokens: 400_000,
  limits: {
    maxInputTokensPerSession: 300_000,
    maxOutputTokensPerSession: 60_000,
    sessionTimeoutMs: 7 * 24 * 60 * 60 * 1_000,
  },
});
