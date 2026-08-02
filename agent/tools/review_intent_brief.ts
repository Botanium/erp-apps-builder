import { defineTool } from "eve/tools";
import { z } from "zod";

import { REFERENCE_ACTION } from "../../src/contracts.mjs";
import { machineIdentity } from "../lib/owner-interview-input.ts";
import { initializedReferenceSliceForSession } from "../lib/reference-slice-runtime.ts";

export default defineTool({
  description:
    "Review one exact fictitious Intent Brief Version through ReferenceSlice.dispatch without granting approval.",
  inputSchema: z
    .object({
      adapterRequestIdentity: machineIdentity,
      ownerInterviewIdentity: machineIdentity,
      versionIdentity: machineIdentity,
    })
    .strict(),
  async execute(input, ctx) {
    const { referenceSlice } = await initializedReferenceSliceForSession(
      ctx.session.id
    );
    const view = await referenceSlice.dispatch({
      type: REFERENCE_ACTION.reviewIntentBrief,
      ownerInterviewIdentity: input.ownerInterviewIdentity,
      versionIdentity: input.versionIdentity,
    });
    return {
      adapterRequestIdentity: input.adapterRequestIdentity,
      view,
    };
  },
});
