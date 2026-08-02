import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

const command = {
  kernelCommandIdentity: "kernel-command.eve-replay-fixture",
  orchestrationRunIdentity: "orchestration-run.eve-replay-fixture",
  recordedTime: "2026-08-02T12:00:00.000Z",
};

const submitRequest = (adapterRequestIdentity: string) =>
  JSON.stringify({
    adapterRequestIdentity,
    operation: "submit-empty-authority-shell",
    command,
  });

export default defineEval({
  description:
    "Eve parks before Kernel submission and an unchanged duplicate delivery returns the same durable result without duplicating effects.",
  async test(t) {
    const firstPending = await t.send(
      submitRequest("adapter-request.kernel-submit-first")
    );
    firstPending.parked();
    const firstGate = t.requireInputRequest({
      kind: "tool-approval",
      toolName: "submit_kernel_command",
    });
    const firstCompleted = await t.respond({
      requestId: firstGate.requestId,
      optionId: "approve",
    });
    const firstOutput = JSON.parse(firstCompleted.message ?? "null");

    const secondPending = await t.send(
      submitRequest("adapter-request.kernel-submit-replay")
    );
    secondPending.parked();
    const secondGate = t.requireInputRequest({
      kind: "tool-approval",
      toolName: "submit_kernel_command",
    });
    const secondCompleted = await t.respond({
      requestId: secondGate.requestId,
      optionId: "approve",
    });
    const secondOutput = JSON.parse(secondCompleted.message ?? "null");

    await t.send(
      JSON.stringify({
        adapterRequestIdentity: "adapter-request.kernel-submit-observe",
        operation: "observe-empty-authority",
      })
    );

    t.succeeded();
    t.calledTool("submit_kernel_command", { count: 2 });
    t.check(firstOutput.result.disposition, equals("Accepted"));
    t.check(secondOutput.result, equals(firstOutput.result));
    t.messageIncludes('"kernelCommandResults":1');
    t.messageIncludes('"businessEvents":0');
    t.messageIncludes('"stockMovements":0');
    t.messageIncludes('"ledgerEntries":0');
  },
});
