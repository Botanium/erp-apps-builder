/**
 * @typedef {object} EvidenceInput
 * @property {Array<{identity: string, version: string, criticality: string}>} completionConditions
 * @property {{view: object, rejection: object, observation: object}} sources
 */

/**
 * @typedef {object} AcceptanceReport
 * @property {"AcceptanceReport"} kind
 * @property {"Indeterminate"} verdict
 * @property {Array<object>} completionConditions
 * @property {{createsGovernedTruth: false, ownerAcceptance: false}} authority
 */

export class AcceptanceEvaluator {
  /**
   * Evaluate exact durable evidence without mutating or upgrading its authority.
   * @param {EvidenceInput} evidenceInput
   * @returns {Promise<AcceptanceReport>}
   */
  async evaluate({ completionConditions, sources }) {
    const hasNoBusinessTruth = Object.values(
      sources.observation.business
    ).every((count) => count === 0);
    const hasNoBlueprintAuthority = Object.values(
      sources.observation.authority
    ).every((count) => count === 0);
    const isUnsupportedRejection =
      sources.rejection.disposition === "Rejected" &&
      sources.rejection.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === DIAGNOSTIC_CODE.commandUnsupportedAction
      );

    if (
      sources.view.kind !== "ReferenceSliceView" ||
      !hasNoBusinessTruth ||
      !hasNoBlueprintAuthority ||
      !isUnsupportedRejection
    ) {
      throw new Error("The empty authority shell evidence is inconsistent.");
    }

    return {
      kind: "AcceptanceReport",
      verdict: "Indeterminate",
      completionConditions: completionConditions.map((condition) => ({
        ...condition,
        verdict: "Indeterminate",
        diagnostic: {
          code: DIAGNOSTIC_CODE.completionNotEstablished,
          summary:
            "The empty authority shell does not yet prove the v1 Reference Vertical Slice.",
        },
      })),
      authority: {
        createsGovernedTruth: false,
        ownerAcceptance: false,
      },
    };
  }
}
import { DIAGNOSTIC_CODE } from "./contracts.mjs";
