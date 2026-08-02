import { defineTool } from "eve/tools";
import { z } from "zod";

import { REFERENCE_ACTION } from "../../src/contracts.mjs";
import { machineIdentity } from "../lib/owner-interview-input.ts";
import { initializedReferenceSliceForSession } from "../lib/reference-slice-runtime.ts";

export default defineTool({
  description:
    "Start the local fictitious Owner Interview through ReferenceSlice.dispatch.",
  inputSchema: z
    .object({
      adapterRequestIdentity: machineIdentity,
      ownerSourceIdentity: machineIdentity,
    })
    .strict(),
  async execute(input, ctx) {
    const { referenceSlice } = await initializedReferenceSliceForSession(
      ctx.session.id
    );
    const view = await referenceSlice.dispatch({
      type: REFERENCE_ACTION.startOwnerInterview,
      ownerSourceIdentity: input.ownerSourceIdentity,
    });
    return {
      adapterRequestIdentity: input.adapterRequestIdentity,
      view,
    };
  },
});
