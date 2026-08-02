import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

import { EMPTY_REFERENCE_SCOPE, KERNEL_ACTION } from "../../src/contracts.mjs";
import { createKernelCommand } from "../../src/kernel-command.mjs";
import { machineIdentity } from "../lib/owner-interview-input.ts";
import { referenceSliceForSession } from "../lib/reference-slice-runtime.ts";

export default defineTool({
  description:
    "Submit one closed, fictitious empty-authority-shell Kernel Command after an Eve delivery approval. The Business Kernel remains the sole authority.",
  inputSchema: z
    .object({
      adapterRequestIdentity: machineIdentity,
      command: z
        .object({
          kernelCommandIdentity: machineIdentity,
          orchestrationRunIdentity: machineIdentity,
          recordedTime: z.string().datetime({ offset: true }),
        })
        .strict(),
    })
    .strict(),
  approval: always(),
  async execute(input, ctx) {
    const { businessKernel } = await referenceSliceForSession(ctx.session.id);
    const result = await businessKernel.submit(
      createKernelCommand({
        kernelCommandIdentity: input.command.kernelCommandIdentity,
        tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
        governedActionIdentity: KERNEL_ACTION.initializeEmptyAuthorityShell,
        input: { scope: EMPTY_REFERENCE_SCOPE },
        expectedBaseline: { stateRevision: 0, tenantIdentity: null },
        responsibleSourceIdentity: "source.local-eve-operator",
        orchestrationRunIdentity: input.command.orchestrationRunIdentity,
        recordedTime: input.command.recordedTime,
      })
    );
    return {
      adapterRequestIdentity: input.adapterRequestIdentity,
      result,
    };
  },
});
