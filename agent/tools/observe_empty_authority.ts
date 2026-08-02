import { defineTool } from "eve/tools";
import { z } from "zod";

import { EMPTY_REFERENCE_SCOPE, KERNEL_QUERY } from "../../src/contracts.mjs";
import { machineIdentity } from "../lib/owner-interview-input.ts";
import { initializedReferenceSliceForSession } from "../lib/reference-slice-runtime.ts";

export default defineTool({
  description:
    "Read the local empty-state authority and business counters through BusinessKernel.observe.",
  inputSchema: z
    .object({
      adapterRequestIdentity: machineIdentity,
    })
    .strict(),
  async execute(input, ctx) {
    const { businessKernel } = await initializedReferenceSliceForSession(
      ctx.session.id
    );
    const observation = await businessKernel.observe({
      type: KERNEL_QUERY.emptyAuthorityState,
      tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
    });
    return {
      adapterRequestIdentity: input.adapterRequestIdentity,
      observation,
    };
  },
});
