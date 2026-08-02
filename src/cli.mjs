import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  EMPTY_REFERENCE_SCOPE,
  KERNEL_ACTION,
  KERNEL_QUERY,
  REFERENCE_ACTION,
} from "./contracts.mjs";
import { createKernelCommand } from "./kernel-command.mjs";
import { createLocalReferenceSlice } from "./reference-slice.mjs";

const run = async () => {
  const runParent =
    process.env.ABOS_RUN_PARENT ??
    join(tmpdir(), "adaptive-business-os-reference-slice");
  await mkdir(runParent, { recursive: true });
  const runDirectory = await mkdtemp(join(runParent, "run-"));
  const clock = { now: () => new Date().toISOString() };
  const system = await createLocalReferenceSlice({
    persistence: {
      kind: "atomic-json",
      stateFile: join(runDirectory, "state.json"),
    },
    clock,
  });

  const view = await system.referenceSlice.dispatch({
    type: REFERENCE_ACTION.startEmptyAuthorityShell,
  });
  const rejection = await system.businessKernel.submit(
    createKernelCommand({
      kernelCommandIdentity: randomUUID(),
      governedActionIdentity: KERNEL_ACTION.unsupportedFixture,
      tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
      recordedTime: clock.now(),
      expectedBaseline: {
        stateRevision: 1,
        tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
      },
      input: {},
      responsibleSourceIdentity: "source.local-operator",
      orchestrationRunIdentity: view.run.orchestrationRunIdentity,
    })
  );
  const observation = await system.businessKernel.observe({
    type: KERNEL_QUERY.emptyAuthorityState,
    tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
  });
  const acceptance = await system.acceptanceEvaluator.evaluate({
    completionConditions: [
      {
        identity: "reference-slice.condition.v1-complete",
        version: "1.0.0",
        criticality: "Required",
      },
    ],
    sources: { view, rejection, observation },
  });

  process.stdout.write(
    `${JSON.stringify({
      kind: "ReferenceSliceCommandResult",
      runDirectory,
      view,
      rejection,
      observation,
      acceptance,
    })}\n`
  );
  process.exitCode = acceptance.verdict === "Passed" ? 0 : 1;
};

await run();
