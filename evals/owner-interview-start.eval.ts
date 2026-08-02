import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "Eve starts the fictitious Owner Interview only through ReferenceSlice.dispatch.",
  async test(t) {
    await t.send(
      JSON.stringify({
        adapterRequestIdentity: "adapter-request.owner-interview-start",
        operation: "start-owner-interview",
        ownerSourceIdentity: "source.owner.eve-fixture",
      })
    );

    t.succeeded();
    t.calledTool("start_owner_interview", { count: 1 });
    t.messageIncludes('"mode":"OwnerInterview"');
    t.notCalledTool("bash");
    t.notCalledTool("write_file");
    t.notCalledTool("web_fetch");
  },
});
