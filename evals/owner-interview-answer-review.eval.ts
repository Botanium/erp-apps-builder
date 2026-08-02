import { defineEval } from "eve/evals";

const request = (value: Record<string, unknown>) => JSON.stringify(value);

export default defineEval({
  description:
    "Eve answers one fictitious interview question and reviews the resulting exact Intent Brief Version.",
  async test(t) {
    const startedTurn = await t.send(
      request({
        adapterRequestIdentity: "adapter-request.interview-sequence-start",
        operation: "start-owner-interview",
        ownerSourceIdentity: "source.owner.eve-fixture",
      })
    );
    const started = JSON.parse(startedTurn.message);
    const interview = started.view.ownerInterview;

    const answeredTurn = await t.send(
      request({
        adapterRequestIdentity: "adapter-request.interview-sequence-answer",
        operation: "answer-owner-interview",
        ownerInterviewIdentity: interview.identity,
        questionIdentity: interview.currentQuestion.identity,
        answer: {
          statementIdentity: "intent-statement.purpose-and-scope",
          intentState: "Confirmed",
          value:
            "Prove retail and cafe reuse from one shared Business Kernel using only fictitious sandbox data.",
        },
      })
    );
    const answered = JSON.parse(answeredTurn.message);

    await t.send(
      request({
        adapterRequestIdentity: "adapter-request.interview-sequence-review",
        operation: "review-intent-brief",
        ownerInterviewIdentity: interview.identity,
        versionIdentity:
          answered.view.ownerInterview.intentBrief.versionIdentity,
      })
    );

    t.succeeded();
    t.calledTool("start_owner_interview", { count: 1 });
    t.calledTool("answer_owner_interview", { count: 1 });
    t.calledTool("review_intent_brief", { count: 1 });
    t.messageIncludes('"mode":"IntentBriefReview"');
    t.messageIncludes('"blueprintApproval":false');
    t.messageIncludes('"appliedBlueprint":false');
    t.messageIncludes('"businessTruth":false');
    t.notCalledTool("submit_kernel_command");
  },
});
