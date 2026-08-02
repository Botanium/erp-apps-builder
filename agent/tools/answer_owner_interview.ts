import { defineTool } from "eve/tools";
import { z } from "zod";

import { REFERENCE_ACTION } from "../../src/contracts.mjs";
import {
  machineIdentity,
  ownerInterviewAnswer,
} from "../lib/owner-interview-input.ts";
import { initializedReferenceSliceForSession } from "../lib/reference-slice-runtime.ts";

export default defineTool({
  description:
    "Record one attributable fictitious Owner Interview answer through ReferenceSlice.dispatch.",
  inputSchema: z
    .object({
      adapterRequestIdentity: machineIdentity,
      ownerInterviewIdentity: machineIdentity,
      questionIdentity: machineIdentity,
      answer: ownerInterviewAnswer,
    })
    .strict(),
  async execute(input, ctx) {
    const { referenceSlice } = await initializedReferenceSliceForSession(
      ctx.session.id
    );
    const view = await referenceSlice.dispatch({
      type: REFERENCE_ACTION.answerOwnerInterview,
      ownerInterviewIdentity: input.ownerInterviewIdentity,
      questionIdentity: input.questionIdentity,
      answer: input.answer,
    });
    return {
      adapterRequestIdentity: input.adapterRequestIdentity,
      view,
    };
  },
});
