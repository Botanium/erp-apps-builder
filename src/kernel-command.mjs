import { sha256ContentIdentity } from "./canonical-json.mjs";
import {
  CONTRACT_VERSION,
  MACHINE_IDENTITY,
  VERSION_SET,
} from "./contracts.mjs";

/**
 * Build the closed Ticket 01 Kernel Command envelope and bind its canonical
 * authority-relevant content. This factory is an internal composition aid;
 * BusinessKernel.submit remains the sole command-processing seam.
 */
export const createKernelCommand = ({
  kernelCommandIdentity,
  tenantIdentity,
  governedActionIdentity,
  input,
  expectedBaseline,
  responsibleSourceIdentity,
  orchestrationRunIdentity,
  recordedTime,
}) => {
  const authorityContent = {
    kind: "KernelCommand",
    kernelCommandIdentity,
    tenantIdentity,
    locationIdentity: null,
    governedActionIdentity,
    governedActionVersion: CONTRACT_VERSION,
    subject: {
      kind: "KernelFoundation",
      identity: MACHINE_IDENTITY.kernelFoundation,
    },
    expectedBaseline,
    input: structuredClone(input),
    responsibleSource: {
      kind: "LocalOperator",
      identity: responsibleSourceIdentity,
    },
    creationTime: recordedTime,
    requestedEffectiveTime: recordedTime,
    versionSet: structuredClone(VERSION_SET),
    roleReferences: [],
    evidenceReferences: [],
    policyReferences: [],
    separationOfDutyReferences: [],
    humanGateDecision: null,
    orchestrationRunIdentity,
    agentRunIdentity: null,
    causationReferences: [],
    predecessorReference: null,
    freshnessBoundary: null,
  };

  return {
    ...authorityContent,
    kernelCommandContentIdentity: sha256ContentIdentity(authorityContent),
  };
};
