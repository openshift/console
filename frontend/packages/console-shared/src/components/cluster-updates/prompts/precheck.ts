import type { VerifiedClusterVersionConditions } from '../cluster-version-helpers';
import {
  PROMPT_TIMEOUT_TOTAL_LIMIT,
  PROMPT_TIMEOUT_WARNING_THRESHOLD,
  PROMPT_TIMEOUT_MAX_EXECUTION,
} from './shared/constants';
import { getLanguageConstraint } from './shared/language-utils';
import { securityConstraint, getConfidenceQualifiers } from './shared/security-utils';
import { formatVerifiedConditions } from './shared/verified-conditions';

/**
 * Pre-check prompt for clusters with available updates
 * Assesses cluster readiness before initiating an upgrade
 *
 * @param currentVersion - Current cluster version
 * @param verified - ClusterVersion condition statuses read directly by the console
 * @returns Formatted prompt for OLS pre-update assessment
 */
export const createPreCheckPrompt = (
  currentVersion: string,
  verified: VerifiedClusterVersionConditions,
) => {
  const languageConstraint = getLanguageConstraint();
  const confidenceQualifiers = getConfidenceQualifiers({
    highConfidenceData: 'ClusterVersion + ClusterOperators',
    highConfidenceQuality: 'conditions are unambiguous',
    moderateConfidenceMissing: 'events, nodes, alerts',
    additionalGuidance: `Apply confidence to specific claims:
- When determining if a conditional update risk applies to this cluster, state your confidence and the evidence (e.g., "High confidence: cluster uses OVN-Kubernetes (verified from network operator status)").
- When a conclusion depends on data that could not be retrieved, say so explicitly rather than presenting it as definitive.`,
  });

  return `# OpenShift Cluster Upgrade Pre-Check Analysis

<constraints>
${languageConstraint}

- YOU MUST ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU MUST ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
- NEVER use placeholder or dummy data - only reference real data from tool calls.
- ONLY report issues that are actually present in the data.
- ONLY OUTPUT the Summary and TL;DR sections.
- CRITICAL: The TL;DR section MUST end with the **Recommendation** field. NEVER omit it.
- Be specific about the source of any issues identified.
- CRITICAL: When counting available updates, count ALL array elements in status.availableUpdates AND status.conditionalUpdates separately.
${securityConstraint}
${confidenceQualifiers}

<scope_definition>
**IN SCOPE - Issues that affect OCP cluster updates:**
- ClusterVersion conditions that block or signal upgrade problems
- ClusterOperator health that blocks operator-phase progression during upgrade
- Node conditions that prevent draining, rebooting, or rejoining during upgrade
- PodDisruptionBudgets that prevent node draining during rolling node updates
- Conditional update risks that apply to this specific cluster (Recommended=False)
- Admin-ack gates required before minor-version upgrades
- Deprecated API usage that will break after upgrade
- Pending CSRs that will prevent nodes from rejoining post-reboot
- OLM Subscription health for layered operators that must be compatible with target release
- Update path validity (channel, skip-level, EUS constraints)
- Resource pressure that prevents upgrade surge capacity
- Active alerts directly relevant to upgrade readiness
- Configuration overrides that mask CVO reconciliation

**OUT OF SCOPE - Do NOT flag these unless they directly affect upgrades:**
- General application performance issues
- User workload errors unrelated to PDBs or node drain
- Non-upgrade-related warnings or events
- Cosmetic issues
- Issues that are recovering on their own and are not blocking
- Anything that does not have a documented effect on oc adm upgrade or the upgrade process

If you cannot tie an issue to a specific upgrade-blocking or upgrade-disrupting mechanism, do not report it.
</scope_definition>
**CRITICAL: Timeout and Error Handling**
**Timeout Awareness:**
- You have a ${PROMPT_TIMEOUT_TOTAL_LIMIT}-second timeout - manage your time wisely
- Prioritize essential data (ClusterVersion, ClusterOperators, admin-acks/admin-gates) first
- Track execution time and stop making new tool calls after ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds
- Provide analysis with available data rather than timing out trying to fetch everything
**Error Handling Rules:**
1. **Be specific about which tool failed** - don't give generic "cannot retrieve data" messages.
2. **Explain what data you're missing** - e.g., "Unable to fetch ClusterVersion resource" vs "Unable to retrieve data".
3. **Try alternative approaches**:
   - If resources_list fails for all ClusterOperators, note this specifically.
   - If nodes_top fails, continue with other analysis - it's optional.
   - If get_alerts fails, skip it - alerts are optional.
   - If events_list fails, continue without event data.
   - If APIRequestCount fails or is unavailable on the cluster version, note it and skip.
4. **Provide partial analysis** - If you get ClusterVersion but not operators, analyze what you have.
5. **Give actionable troubleshooting** when tools fail:
   - Check if OpenShift MCP server is running: 'oc get pods -n openshift-lightspeed'
   - Verify cluster connectivity.
   - Suggest checking MCP server logs for specific errors.
6. **NEVER give up completely** - Always provide SOME analysis even with partial data.
**Example of good error handling** (illustrates STYLE only — never copy these numbers/values; report the real counts and statuses you retrieved):
- BAD: "I cannot retrieve necessary data from the cluster"
- GOOD: "Successfully retrieved ClusterVersion (report the real current version, available-update count, and conditional-update count read from status). However, unable to fetch ClusterOperator list (error: connection timeout). Based on ClusterVersion alone, report the actual Upgradeable and Failing statuses you read. To complete operator health analysis, please verify the OpenShift MCP server is accessible."
**Example of good timeout handling** (STYLE only — substitute the real counts you retrieved):
- GOOD: "Retrieved ClusterVersion, all ClusterOperators (report the real total), admin-acks, and admin-gates. Skipping APIRequestCount and alerts to avoid timeout. All admin-ack gates are satisfied; cluster is on track for upgrade."
**Tool Call Priority to Avoid Timeouts:**
**PHASE 1 - ESSENTIAL (Always fetch, target under 25 seconds):**
1. resources_get: ClusterVersion (apiVersion: "config.openshift.io/v1", kind: "ClusterVersion", name: "version")
   - Capture full status including: conditions, availableUpdates, conditionalUpdates, history, capabilities, desired
2. resources_list: ClusterOperator (apiVersion: "config.openshift.io/v1", kind: "ClusterOperator")
3. resources_get: ConfigMap (apiVersion: "v1", kind: "ConfigMap") "admin-gates" in namespace "openshift-config-managed"
   (core v1 ConfigMap, NOT config.openshift.io/v1; lists upgrade-blocking gate keys defined by the cluster's components)
4. resources_get: ConfigMap (apiVersion: "v1", kind: "ConfigMap") "admin-acks" in namespace "openshift-config"
   (core v1 ConfigMap, NOT config.openshift.io/v1; lists administrator acknowledgements)
**PHASE 2 - IMPORTANT (Fetch if time permits, under 45 seconds total):**
5. resources_list: Node (apiVersion: "v1", kind: "Node") - Quick check for NotReady nodes and pressure conditions
6. events_list: Get recent warning/error events from last 30 minutes in upgrade-relevant namespaces (openshift-cluster-version, openshift-machine-config-operator, openshift-etcd, openshift-kube-apiserver, openshift-apiserver, openshift-authentication, openshift-network-operator, openshift-monitoring)
**PHASE 3 - OPTIONAL (Only if under ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds total):**
7. nodes_top: Check node CPU/memory usage
8. resources_list: PodDisruptionBudget (apiVersion: "policy/v1", kind: "PodDisruptionBudget") - Filter out openshift-*, kube-*, default, openshift
9. resources_list: APIRequestCount (apiVersion: "apiserver.openshift.io/v1", kind: "APIRequestCount") - Identify deprecated APIs in use
10. resources_list: CertificateSigningRequest (apiVersion: "certificates.k8s.io/v1", kind: "CertificateSigningRequest") - Filter for Pending state
11. resources_list: MachineHealthCheck (apiVersion: "machine.openshift.io/v1beta1", kind: "MachineHealthCheck") - Check for unpaused MHCs
12. resources_list: Subscription (apiVersion: "operators.coreos.com/v1alpha1", kind: "Subscription") - Layered operator health
13. get_alerts: Check for critical/warning alerts
**CRITICAL EFFICIENCY RULES:**
- If approaching ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds of execution time, STOP making new tool calls and provide analysis with data collected
- NEVER let total execution exceed ${PROMPT_TIMEOUT_MAX_EXECUTION} seconds to avoid timeout
- Prioritize breadth over depth: Get ClusterVersion + ClusterOperators + admin-acks fully before diving into logs/events
- Skip optional data if essential data took longer than expected
</constraints>

<context>
This is a pre-upgrade analysis for OpenShift cluster version ${currentVersion}. You have complete cluster data including ClusterVersion, all ClusterOperator resources, admin-acks/admin-gates ConfigMaps, and supporting infrastructure resources. Focus on identifying real blockers and risks that would prevent or disrupt cluster upgrades. Stay strictly within the upgrade-impact scope defined above.
</context>

${formatVerifiedConditions(verified)}

<condition_checking_guide>
NOTE: The {type, status} pairs below are a REFERENCE LEGEND showing how to interpret conditions in general — they are NOT this cluster's data. Never copy a status from this legend into your output. Read the ClusterVersion condition statuses from <verified_clusterversion_conditions> above, and read every other condition (ClusterOperators, nodes, PDBs, etc.) from the tool call results.

CRITICAL: Understanding Kubernetes/OpenShift Conditions

Conditions have TWO important fields you MUST check:
- **type**: The name of the condition (e.g., "Failing", "Available", "Progressing", "Upgradeable", "Recommended")
- **status**: The state of the condition (ONLY these values: "True", "False", or "Unknown")
**DO NOT report a problem unless status="True" for negative conditions OR status="False" for positive conditions!**
**Critical Examples - MEMORIZE THESE:**
ClusterVersion / ClusterOperator / general:
- {type: "Failing", status: "False"} → Cluster is NOT failing → NO PROBLEM
- {type: "Failing", status: "True"} → Cluster IS failing → PROBLEM
- {type: "Available", status: "True"} → Component IS available → NO PROBLEM
- {type: "Available", status: "False"} → Component is NOT available → PROBLEM
- {type: "Degraded", status: "False"} → NOT degraded → NO PROBLEM
- {type: "Degraded", status: "True"} → IS degraded → PROBLEM
- {type: "Upgradeable", status: "True"} or absent → Upgrades allowed → NO PROBLEM
- {type: "Upgradeable", status: "False"} → Upgrades BLOCKED → PROBLEM (read message/reason)
- {type: "Progressing", status: "True"} → Currently changing state. Only a problem if stuck (check lastTransitionTime and message for errors).
- {type: "RetrievedUpdates", status: "True"} → Update service healthy → NO PROBLEM
- {type: "RetrievedUpdates", status: "False"} → Cannot reach update service → PROBLEM
- {type: "ReleaseAccepted", status: "True"} → Release image accepted → NO PROBLEM
- {type: "ReleaseAccepted", status: "False"} → Release image rejected (signature/manifest issue) → PROBLEM
- {type: "ImplicitlyEnabledCapabilities", status: "False"} → No capability surprise → NO PROBLEM
- {type: "ImplicitlyEnabledCapabilities", status: "True"} → Disabled capability was implicitly enabled → INFORMATIONAL/WARNING
Conditional update entries (status.conditionalUpdates[].conditions[]):
- {type: "Recommended", status: "True"} → Update IS recommended for this cluster → SAFE
- {type: "Recommended", status: "False"} → Update has KNOWN RISK matching this cluster → REPORT RISK (name, message, url)
- {type: "Recommended", status: "Unknown"} → CVO still evaluating → INFORMATIONAL
Node conditions:
- {type: "Ready", status: "True"} → Node is ready → NO PROBLEM
- {type: "Ready", status: "False"} or "Unknown" → Node NotReady → PROBLEM (will block drain/upgrade on that node)
- {type: "MemoryPressure", status: "True"} → Memory pressure → PROBLEM
- {type: "DiskPressure", status: "True"} → Disk pressure → PROBLEM (often blocks image pulls during upgrade)
- {type: "PIDPressure", status: "True"} → PID pressure → PROBLEM
- {type: "NetworkUnavailable", status: "True"} → Network unavailable → PROBLEM
**VERIFICATION REQUIREMENT:**
Before making ANY conclusion about a condition, you MUST internally state:
"Condition type='X' has status='Y'" and then interpret it correctly.
**NEVER assume a condition is true just because the type exists - ALWAYS check the status field!**
</condition_checking_guide>

<critical_analysis_requirements>
### 1. Available and Conditional Updates
- Count EXACTLY the items in status.availableUpdates and status.conditionalUpdates (separately). For each available update extract version, image, channels[], url (errata); identify the latest recommended z-stream and y-stream.
- For each conditionalUpdate, read the conditions[] entry with type="Recommended": status="False" → cluster matches a known risk (extract target release.version/image, reason, message, and every risks[] name/message/url); status="Unknown" → CVO still evaluating (informational); status="True" → effectively recommended. Recommended=False is a risk the admin must explicitly accept, not itself a hard blocker — surface it prominently.

### 2. ClusterVersion Conditions
Read the status field of each and interpret per <condition_checking_guide>; quote reason and message when reporting a problem.
- Failing=True → reconciliation failure. Upgradeable=False → upgrades explicitly blocked (report reason verbatim; e.g. AdminAckRequired, MultipleReasons). Available=False → operationally impaired. Progressing=True outside an admin-initiated upgrade → possible stuck reconciliation. RetrievedUpdates=False → update service unreachable. ReleaseAccepted=False → desired release rejected (signature/manifest/pull). ImplicitlyEnabledCapabilities=True → a spec-disabled capability was implicitly enabled (informational).

### 3. Admin-Ack Gates (CRITICAL for minor upgrades)
CVO sets Upgradeable=False with reason=AdminAckRequired until all applicable gates are acknowledged.
- Read gate keys from ConfigMap admin-gates (core v1 ConfigMap, apiVersion "v1" — NOT config.openshift.io/v1; namespace openshift-config-managed; key shape e.g. ack-4.13-kube-1.27-api-removals-in-4.14) and acknowledgements from ConfigMap admin-acks (core v1 ConfigMap, apiVersion "v1"; namespace openshift-config); an ack is valid only if the value is the literal "true".
- Per admin-gates key: matching admin-acks value "true" → ACKNOWLEDGED; missing/other → NOT ACKNOWLEDGED (minor upgrade blocked). Report each unacknowledged gate by its exact key and the fix: 'oc -n openshift-config patch cm admin-acks --patch '{"data":{"<gate-key>":"true"}}' --type=merge'. Do not invent keys. Empty/absent admin-gates → none apply; unreadable ConfigMap → note gate state cannot be confirmed.

### 4. ClusterOperator Health (per operator, status.conditions[])
- Available=False → BLOCKER. Degraded=True → WARNING (BLOCKER if also Available=False). Upgradeable=False → BLOCKER for minor (sometimes z-stream) upgrades (report reason/message). Progressing=True for an extended period with errors (no admin-initiated upgrade in flight) → possible stuck reconciliation.
- Critical operators whose failures are upgrade-blocking by nature: cluster-version (CVO), etcd, kube-apiserver, kube-controller-manager, kube-scheduler, openshift-apiserver, machine-config, machine-api, authentication, network (SDN/OVN), dns, ingress, monitoring, image-registry, storage and CSI driver operators. For each problem report name, failing condition (type and status), reason, message.

### 5. Node Health and Resource Pressure
- Per Node status.conditions: Ready=False/Unknown → BLOCKER (node cannot drain, reboot, rejoin). MemoryPressure=True → BLOCKER/WARNING (evictions may not converge during surge). DiskPressure=True → BLOCKER (new-release image pulls fail). PIDPressure=True / NetworkUnavailable=True → BLOCKER. spec.unschedulable=true (cordoned) outside an active drain → flag. Report node name and the condition's reason/message.
- nodes_top (optional): flag any node with CPU or memory > 90%. Rolling upgrades need surge capacity (control-plane revisions roll one node at a time; worker pools drain one at a time), so saturated nodes can block drain/rescheduling; control-plane memory pressure is especially impactful (etcd I/O sensitivity).

### 6. PodDisruptionBudgets (user workload drain blockers)
Worker nodes drain one at a time during rolling updates; a PDB that forbids eviction blocks the drain indefinitely.
- Query PDBs in ALL namespaces EXCEPT openshift-*, kube-*, default, openshift. Flag a user PDB as a drain blocker if ANY: status.disruptionsAllowed==0 AND status.currentHealthy<=status.desiredHealthy; spec.minAvailable==100% (or ==status.expectedPods); spec.maxUnavailable==0; selector matches zero pods (status.expectedPods==0) AND minAvailable>=1 (misconfigured). Report namespace, name, offending field, disruptionsAllowed. Ignore system-namespace PDBs (Red Hat managed). None → "No problematic user workload PDBs found".

### 7. Update Path Validation
- Channel: read spec.channel (e.g. stable-4.21, eus-4.18); if not present in status.desired.channels[] AND RetrievedUpdates=False, flag as possibly invalid for this version. Skip-level: OpenShift cannot skip minors (except the EUS-to-EUS path with paused worker pools); if the latest available/conditional target is more than one minor ahead, note the path constraint. EUS: a spec.channel starting with eus- means pausing/unpausing worker updates is part of the workflow.

### 8. Deprecated API Usage (affects minor upgrades)
- If APIRequestCount (apiserver.openshift.io/v1) is available: for each, read status.removedInRelease; if set AND the target minor matches or exceeds it, read status.currentHour.byUser[] and status.last24h[].byUser[] to identify callers. Report API name (e.g. flowschemas.v1beta2.flowcontrol.apiserver.k8s.io), removedInRelease, and deduplicated top callers (username and userAgent). No deprecated APIs in use / none removed by target → state so. Unavailable → skip with a note.

### 9. Pending CertificateSigningRequests
Rebooting nodes need kubelet client/serving certs approved to rejoin; a backlog can block rejoin.
- List CSRs; filter to pending (no Approved and no Denied condition, or empty status.certificate). Group by spec.signerName (e.g. kubernetes.io/kube-apiserver-client-kubelet, kubernetes.io/kubelet-serving). If 5 or more node-related CSRs are pending, flag a node-rejoin risk with counts and signer names. Ignore non-node custom signers unless tied to upgrade workflows.

### 10. MachineHealthChecks
Active MHCs can remediate nodes intentionally drained/rebooted during upgrade; Red Hat recommends pausing them.
- List MHCs; treat as paused if any pause annotation is present (e.g. cluster.x-k8s.io/paused; annotation varies by OCP version). Report MHCs that are NOT paused and the node sets they will roll — as a recommendation to pause, not a blocker.

### 11. OLM Subscription Health (layered operators)
Layered operators must be on a channel/version compatible with the target release before upgrade.
- List Subscriptions; per status.conditions[]: CatalogSourcesUnhealthy=True (catalog unreachable, blocks operator updates); InstallPlanFailed=True or ResolutionFailed=True (cannot install/update); InstallPlanPending=True and not progressing (manual approval may be required). Report by namespace and name; do not flag healthy Subscriptions.

### 12. Cluster Capabilities
- enabled = status.capabilities.enabledCapabilities; known = status.capabilities.knownCapabilities; disabled = known minus enabled (note these). If ImplicitlyEnabledCapabilities=True, note the target implicitly enables a spec-disabled capability. Rarely blockers, but capability transitions change which operators are reconciled.

### 13. Cincinnati Update Service Health
- spec.upstream set → custom update service, else default Red Hat service. Report RetrievedUpdates status, lastTransitionTime, message. availableUpdates empty AND RetrievedUpdates=True → on the latest known version in its channel; empty AND RetrievedUpdates=False → discovery broken. Report spec.clusterID (telemetry); note spec.signatureStores if present (disconnected clusters / ReleaseAccepted relevance).

### 14. Version History Context
- Initial version: oldest status.history[] entry. Most recent completed upgrade: newest entry with state="Completed". Any state="Partial" entries → failed/interrupted upgrades, surface them. Cluster age: from the oldest entry's startedTime/completionTime.

### 15. Configuration Overrides
- spec.overrides[] with unmanaged=true → CVO will not reconcile that resource. Not blockers, but they can mask drift and cause post-upgrade inconsistencies — surface as informational.

### 16. Recent Events (upgrade-relevant only)
- Events from the last 30 minutes, type Warning or higher, restricted to: openshift-cluster-version, openshift-machine-config-operator, openshift-etcd, openshift-kube-apiserver, openshift-apiserver, openshift-authentication, openshift-network-operator, openshift-monitoring. Group by reason and involvedObject. Translate to plain language (ImagePullBackOff → operator pod cannot pull its image, check registry/pull secrets; FailedScheduling → check node taints/resources/selectors; etcd Unhealthy → etcd member health failing, investigate before upgrading). Skip unrelated events.

### 17. Active Alerts (optional)
- If get_alerts is available: focus on severity critical and warning, prioritizing upgrade-impact names (e.g. ClusterNotUpgradeable, ClusterOperatorDown, ClusterOperatorDegraded, KubeAPIDown, etcdMembersDown, etcdInsufficientMembers, KubePersistentVolumeFillingUp, NodeFilesystemSpaceFillingUp, KubeNodeNotReady, MachineConfigDaemonReboot-style). Translate each fired alert into an actionable recommendation. Unavailable → skip this section.
</critical_analysis_requirements>

<output_format>
## Summary
**Update service health**
- **Cincinnati service**: [spec.upstream URL, or "Default Red Hat update service"]
- **Service status**: [RetrievedUpdates status and message]
- **Last update check**: [RetrievedUpdates lastTransitionTime]
- **Update channel**: [spec.channel]
- **Channel validity**: [valid for current version, or not in status.desired.channels]
- **Cluster ID**: [spec.clusterID]
**Cluster history context**
- **Initial version**: [oldest status.history entry with date]
- **Upgrade path**: [recent version progression]
- **Last completed upgrade**: [most recent Completed entry with timeframe]
- **Partial/failed upgrade history**: [Partial entries, or "None"]
- **Cluster age**: [time since initial installation]
**Available updates**
- **Recommended updates**: [count from status.availableUpdates with versions]
- **Conditional updates**: [count from status.conditionalUpdates]
- **Conditional update risk analysis**: for each Recommended=False, list target version, risk name, risk message, reference URL; else "No conditional update risks apply to this cluster"
**Upgrade readiness assessment**
For EACH condition below, state the exact status="X" value you read, then the interpretation (include reason and message when reporting a problem). CRITICAL: report each status ONLY from the retrieved status.conditions[] array. If a condition type is not present in that array, say "absent" and apply the guide (Upgradeable absent = upgrades allowed = NO PROBLEM). NEVER report Failing=True or Upgradeable=False unless that exact type/status pair is actually present in the retrieved data — do not infer a failing/blocked state from the presence of available updates, from an inability to fetch other resources, or from any example in this prompt.
**ClusterVersion conditions:** Failing; Upgradeable (or absent); Available; Progressing (flag only if stuck outside an admin-initiated upgrade); RetrievedUpdates; ReleaseAccepted; ImplicitlyEnabledCapabilities.
**Admin-ack gates (minor upgrade prerequisite):**
- **Defined gates** (openshift-config-managed/admin-gates): [keys, or "None"]
- **Acknowledged** (openshift-config/admin-acks with value "true"): [keys]
- **Outstanding gates blocking minor upgrade**: [keys not acknowledged, or "None — all gates satisfied"]
- **Action**: exact oc patch command (with the actual key) for each outstanding gate.
**ClusterOperator health:** [total count]; for each problematic operator: name, failing condition (type and status), reason, message; else "All ClusterOperators report Available=True, Degraded=False, Upgradeable=True".
**Infrastructure health:**
- **Node status**: [NotReady nodes with names/reasons; nodes with MemoryPressure/DiskPressure/PIDPressure/NetworkUnavailable]
- **Resource pressure**: [nodes >90% CPU or memory from nodes_top]
- **Pending CSRs**: [count and signer names if >= 5 pending node-related CSRs]
- **MachineHealthChecks**: [count of unpaused MHCs — informational]
- **User workload PDBs**: [problematic non-OpenShift PDBs that could block node draining, with namespace/name and offending field]
**Deprecated API usage:** [for each API removed in target: name, removedInRelease, top callers (username/userAgent); else state none in use or APIRequestCount unavailable]
**Layered operator health (OLM):** [Subscriptions with issues: namespace/name and failing condition (CatalogSourcesUnhealthy, InstallPlanFailed, ResolutionFailed, etc.); else "All Subscriptions healthy"]
**Recent events** (last 30 minutes, upgrade-relevant namespaces): [critical count and grouped descriptions; warning count and grouped descriptions; plain-language summary; else "No recent errors or warnings detected in upgrade-relevant components"]
**Active alerts** (if available): [critical count and names; warning count and names; upgrade-readiness impact for each; else skip this section]
**Configuration:** [spec.overrides with unmanaged=true; capabilities enabled count and disabled-but-known count with names; ImplicitlyEnabledCapabilities note if applicable]
**Final assessment:** Based ONLY on issues identified above, output exactly one of:
- "Cluster appears ready for upgrade." (no upgrade-blocking conditions and no unaccepted conditional risks)
- "Cluster can upgrade after administrator review of: [list]. No hard blockers." (only conditional update risks or warnings)
- "Upgrade blocked — must resolve [list of specific blockers] first." (any hard blocker present)
A hard blocker = any condition marked BLOCKER in the analysis above (e.g., an outstanding admin-ack gate for a minor upgrade, or an in-use deprecated API removed in the target minor).
## TL;DR
- **Current version**: ${currentVersion}
- **Data completeness**: [Complete | Partial | Limited]
- **Available updates**: [count]
- **Latest recommended update**: [version with channels]
- **Conditional updates**: [count] ([N with Recommended=False risks applying])
- **Update channel**: [spec.channel] ([valid / not in status.desired.channels])
- **Channel options**: [available channels]
- **Capabilities**: [enabled / disabled counts with names]
- **Initial version**: [with date]
- **Last upgrade**: [most recent completed, with date]
- **Cincinnati health**: [status with timestamp]
- **Admin-ack gates**: [satisfied | N outstanding: keys]
- **Upgrade blocked**: [Yes | No — "Yes" only when you can cite a specific hard-blocker condition (type + status read from tool output). If ClusterVersion shows Failing=False, Available=True, and Upgradeable is True or absent, and no other blocker was found, this is "No"]
- **Upgrade blockers**: [list with status values, or "No blockers"]
- **Conditional risks to acknowledge**: [risk names with target versions, or "None"]
- **Unhealthy ClusterOperators**: [count and names with failing condition]
- **Node issues**: [count of NotReady/pressure-affected nodes with names]
- **Resource pressure**: [nodes >90% CPU or memory]
- **User workload PDBs blocking drain**: [count with namespace/name]
- **Pending node CSRs**: [count if >= 5, else "None significant"]
- **Deprecated APIs in use**: [count removed in target, with names]
- **Layered operator issues**: [count of unhealthy Subscriptions]
- **Recent events**: [count in last 30 min]
- **Active alerts**: [count of critical/warning, skip if unavailable]
- **Configuration issues**: [overrides or capability concerns]
- **Recommendation**: [Proceed with upgrade | Address warnings first | Blocked — resolve listed issues]
</output_format>`;
};

/**
 * Generate precheck prompt for specific target version
 */
