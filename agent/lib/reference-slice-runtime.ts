import { resolve } from "node:path";

import {
  EMPTY_REFERENCE_SCOPE,
  KERNEL_QUERY,
  REFERENCE_ACTION,
} from "../../src/contracts.mjs";
import { createLocalReferenceSlice } from "../../src/reference-slice.mjs";

const runtimes = new Map<
  string,
  Promise<Awaited<ReturnType<typeof createLocalReferenceSlice>>>
>();

const assertSafeSessionIdentity = (sessionIdentity: string): string => {
  if (!/^[A-Za-z0-9._-]+$/.test(sessionIdentity)) {
    throw new TypeError(
      "Eve session identity is not safe for local state scoping."
    );
  }
  return sessionIdentity;
};

const createRuntime = async (sessionIdentity: string) => {
  const safeSessionIdentity = assertSafeSessionIdentity(sessionIdentity);
  return createLocalReferenceSlice({
    persistence: {
      kind: "atomic-json",
      stateFile: resolve(
        ".eve",
        "reference-slice",
        safeSessionIdentity,
        "state.json"
      ),
    },
    clock: { now: () => new Date().toISOString() },
  });
};

export const referenceSliceForSession = (sessionIdentity: string) => {
  const safeSessionIdentity = assertSafeSessionIdentity(sessionIdentity);
  const existing = runtimes.get(safeSessionIdentity);
  if (existing) return existing;

  const pending = createRuntime(safeSessionIdentity);
  runtimes.set(safeSessionIdentity, pending);
  return pending;
};

export const initializedReferenceSliceForSession = async (
  sessionIdentity: string
) => {
  const runtime = await referenceSliceForSession(sessionIdentity);
  const observation = await runtime.businessKernel.observe({
    type: KERNEL_QUERY.emptyAuthorityState,
    tenantIdentity: EMPTY_REFERENCE_SCOPE.tenantIdentity,
  });
  if (observation.disposition === "Rejected") {
    await runtime.referenceSlice.dispatch({
      type: REFERENCE_ACTION.startEmptyAuthorityShell,
    });
  }
  return runtime;
};
