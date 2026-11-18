import type {
  VerifiedClusterVersionConditions,
  VerifiedConditionStatus,
} from '../../cluster-version-helpers';

/**
 * Prompt-ready interpretation of an authoritative ClusterVersion condition status.
 * Paired with the literal status in the injected block so the model does not re-derive
 * (and misread) the meaning from the illustrative condition legend.
 */
const interpret = (
  type: keyof VerifiedClusterVersionConditions,
  status: VerifiedConditionStatus,
) => {
  // Upgradeable=absent is the one condition where a missing status is meaningful: with no
  // Upgradeable condition present, upgrades are allowed. Handle it before the generic
  // Unknown/absent fallback below.
  if (type === 'Upgradeable' && status === 'absent') {
    return 'no Upgradeable condition present; upgrades are allowed';
  }

  // For every other condition, an Unknown or absent status is NOT healthy — it means the
  // status could not be determined. Never let these collapse into the healthy branch, or the
  // model may report readiness when the condition is actually unavailable.
  if (status === 'Unknown') {
    return 'status is Unknown: indeterminate, verify the reason/message via tools';
  }
  if (status === 'absent') {
    return 'condition not reported: status unavailable, verify via tools';
  }

  switch (type) {
    case 'Failing':
      return status === 'True' ? 'cluster IS failing (problem)' : 'cluster is NOT failing';
    case 'Upgradeable':
      return status === 'False'
        ? 'upgrades are BLOCKED — read the reason/message via tools'
        : 'upgrades are allowed';
    case 'Available':
      return status === 'True'
        ? 'cluster is available'
        : 'cluster is NOT fully available (problem)';
    case 'Progressing':
      return status === 'True'
        ? 'an update/reconciliation is in progress'
        : 'not currently progressing';
    case 'RetrievedUpdates':
      return status === 'False'
        ? 'cannot reach the update service (problem)'
        : 'update service is reachable';
    case 'ReleaseAccepted':
      return status === 'False'
        ? 'the desired release was rejected (problem)'
        : 'the desired release was accepted';
    case 'ImplicitlyEnabledCapabilities':
      return status === 'True'
        ? 'a disabled capability was implicitly enabled (informational)'
        : 'no implicitly-enabled capability surprises';
    default:
      return '';
  }
};

// Emit in a fixed, meaningful order rather than relying on object key order.
const CONDITION_ORDER: (keyof VerifiedClusterVersionConditions)[] = [
  'Failing',
  'Upgradeable',
  'Available',
  'Progressing',
  'RetrievedUpdates',
  'ReleaseAccepted',
  'ImplicitlyEnabledCapabilities',
];

/**
 * Render an authoritative `<verified_clusterversion_conditions>` block from statuses the
 * console read directly off the live ClusterVersion. This is the ground truth for the
 * ClusterVersion conditions the pre-check reports; the model must use these values instead
 * of copying statuses out of the interpretation legend or inferring them. Every value is a
 * fixed enum (True/False/Unknown/absent) — no untrusted cluster text — so it is safe to
 * embed verbatim in the prompt.
 */
export const formatVerifiedConditions = (conditions: VerifiedClusterVersionConditions): string => {
  const lines = CONDITION_ORDER.map(
    (type) => `- ${type}: ${conditions[type]} (${interpret(type, conditions[type])})`,
  ).join('\n');

  return `<verified_clusterversion_conditions>
The console reads these ClusterVersion condition statuses directly from the live ClusterVersion resource; they are AUTHORITATIVE. Use these EXACT status values for the ClusterVersion conditions in your analysis and output. Do NOT override them from the interpretation legend below, from the presence of available updates, from an inability to fetch other resources, or from any example in this prompt. You MUST still call the tools for everything else (ClusterOperators, nodes, PDBs, available/conditional updates, admin-ack gates, deprecated APIs, CSRs, MHCs, subscriptions, events, alerts) and to read the reason/message text behind any condition below.
${lines}
</verified_clusterversion_conditions>`;
};
