import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "Eve reads the empty authority projection without treating interview work as governed truth.",
  async test(t) {
    await t.send(
      JSON.stringify({
        adapterRequestIdentity: "adapter-request.authority-start",
        operation: "start-owner-interview",
        ownerSourceIdentity: "source.owner.eve-fixture",
      })
    );
    await t.send(
      JSON.stringify({
        adapterRequestIdentity: "adapter-request.authority-observe",
        operation: "observe-empty-authority",
      })
    );

    t.succeeded();
    t.calledTool("observe_empty_authority", { count: 1 });
    t.messageIncludes('"blueprintApprovals":0');
    t.messageIncludes('"appliedBlueprints":0');
    t.messageIncludes('"records":0');
    t.messageIncludes('"businessEvents":0');
    t.messageIncludes('"stockMovements":0');
    t.messageIncludes('"ledgerEntries":0');
    t.notCalledTool("submit_kernel_command");
  },
});
