import {
  PROMPT_TIMEOUT_TOTAL_LIMIT,
  PROMPT_TIMEOUT_WARNING_THRESHOLD,
  PROMPT_TIMEOUT_MAX_EXECUTION,
} from './shared/constants';
import { getLanguageConstraint } from './shared/language-utils';

/**
 * Pre-check prompt for clusters with available updates
 * Assesses cluster readiness before initiating an upgrade
 *
 * @param currentVersion - Current cluster version
 * @returns Formatted prompt for OLS pre-update assessment
 */
export const createPreCheckPrompt = (currentVersion: string) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Upgrade Pre-Check Analysis

<constraints>
${languageConstraint}

- YOU MUST ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU MUST ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
- NEVER use placeholder or dummy data - only reference real data from tool calls.
- ONLY report issues that are actually present in the data.
- ONLY OUTPUT the Summary and TL;DR sections.
- Be specific about the source of any issues identified.
- CRITICAL: When counting available updates, count ALL array elements in status.availableUpdates AND status.conditionalUpdates separately.

<scope_definition>
**IN SCOPE - Issues that affect OCP cluster updates:**
- ClusterVersion conditions that block or signal upgrade problems
- ClusterOperator health that blocks operator-phase progression during upgrade
- MachineConfigPool state that blocks node-phase rollout
- Node conditions that prevent draining, rebooting, or rejoining during upgrade
- PodDisruptionBudgets that prevent node draining during rolling MCP updates
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
**Example of good error handling:**
- BAD: "I cannot retrieve necessary data from the cluster"
- GOOD: "Successfully retrieved ClusterVersion (current: 4.21.4, 7 updates available, 2 conditional updates with risks). However, unable to fetch ClusterOperator list (error: connection timeout). Based on ClusterVersion alone, the cluster reports Upgradeable=True and Failing=False. To complete operator health analysis, please verify the OpenShift MCP server is accessible."
**Example of good timeout handling:**
- GOOD: "Retrieved ClusterVersion, all 28 ClusterOperators, admin-acks, and admin-gates (execution time: 38 seconds). Skipping APIRequestCount and alerts to avoid timeout. All admin-ack gates are satisfied; cluster is on track for upgrade."
**Tool Call Priority to Avoid Timeouts:**
**PHASE 1 - ESSENTIAL (Always fetch, target under 25 seconds):**
1. resources_get: ClusterVersion (apiVersion: "config.openshift.io/v1", kind: "ClusterVersion", name: "version")
   - Capture full status including: conditions, availableUpdates, conditionalUpdates, history, capabilities, desired
2. resources_list: ClusterOperator (apiVersion: "config.openshift.io/v1", kind: "ClusterOperator")
3. resources_get: ConfigMap "admin-gates" in namespace "openshift-config-managed"
   (lists upgrade-blocking gate keys defined by the cluster's components)
4. resources_get: ConfigMap "admin-acks" in namespace "openshift-config"
   (lists administrator acknowledgements)
**PHASE 2 - IMPORTANT (Fetch if time permits, under 45 seconds total):**
5. resources_list: Node (apiVersion: "v1", kind: "Node") - Quick check for NotReady nodes and pressure conditions
6. resources_list: MachineConfigPool (apiVersion: "machineconfiguration.openshift.io/v1", kind: "MachineConfigPool")
7. events_list: Get recent warning/error events from last 30 minutes in upgrade-relevant namespaces (openshift-cluster-version, openshift-machine-config-operator, openshift-etcd, openshift-kube-apiserver, openshift-apiserver, openshift-authentication, openshift-network-operator)
**PHASE 3 - OPTIONAL (Only if under ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds total):**
8. nodes_top: Check node CPU/memory usage
9. resources_list: PodDisruptionBudget (apiVersion: "policy/v1", kind: "PodDisruptionBudget") - Filter out openshift-*, kube-*
10. resources_list: APIRequestCount (apiVersion: "apiserver.openshift.io/v1", kind: "APIRequestCount") - Identify deprecated APIs in use
11. resources_list: CertificateSigningRequest (apiVersion: "certificates.k8s.io/v1", kind: "CertificateSigningRequest") - Filter for Pending state
12. resources_list: MachineHealthCheck (apiVersion: "machine.openshift.io/v1beta1", kind: "MachineHealthCheck") - Check for unpaused MHCs
13. resources_list: Subscription (apiVersion: "operators.coreos.com/v1alpha1", kind: "Subscription") - Layered operator health
14. get_alerts: Check for critical/warning alerts
**CRITICAL EFFICIENCY RULES:**
- If approaching ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds of execution time, STOP making new tool calls and provide analysis with data collected
- NEVER let total execution exceed ${PROMPT_TIMEOUT_MAX_EXECUTION} seconds to avoid timeout
- Prioritize breadth over depth: Get ClusterVersion + ClusterOperators + admin-acks fully before diving into logs/events
- Skip optional data if essential data took longer than expected
<language_validation>
BEFORE providing your response, verify:
1. Every word in your response is in the target language (except system identifiers like file paths, URLs, command names).
2. Technical terms are translated or explained in the target language.
3. No English phrases or mixed language content exists in your explanations.
4. All section headers and content follow the target language requirements.
</language_validation>
</constraints>

<context>
This is a pre-upgrade analysis for OpenShift cluster version ${currentVersion}. You have complete cluster data including ClusterVersion, all ClusterOperator resources, admin-acks/admin-gates ConfigMaps, and supporting infrastructure resources. Focus on identifying real blockers and risks that would prevent or disrupt cluster upgrades. Stay strictly within the upgrade-impact scope defined above.
</context>

<condition_checking_guide>
CRITICAL: Understanding Kubernetes/OpenShift Conditions

Conditions have TWO important fields you MUST check:
- **type**: The name of the condition (e.g., "Failing", "Available", "Progressing", "Upgradeable", "Recommended")
- **status**: The state of the condition (ONLY these values: "True", "False", or "Unknown")
**MANDATORY CHECKING PROCESS:**
For EVERY condition you analyze, you MUST:
1. First, locate the condition by its type field.
2. Second, read the EXACT value of the status field.
3. Third, interpret based ONLY on the status field value:
   - If status="True" → The condition IS active/present.
   - If status="False" → The condition is NOT active/NOT present.
   - If status="Unknown" → The condition state is uncertain.
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
MachineConfigPool conditions:
- {type: "Updated", status: "True"} → Pool is at desired config → NO PROBLEM
- {type: "Updated", status: "False"} → Pool not yet updated. Only a problem if stuck or paused inappropriately.
- {type: "Updating", status: "True"} → Pool currently rolling. Acceptable mid-upgrade; problem if stuck for hours.
- {type: "Degraded", status: "True"} → Pool degraded → PROBLEM (blocks further node updates)
- {type: "NodeDegraded", status: "True"} → A node in pool failed config apply → PROBLEM
- {type: "RenderDegraded", status: "True"} → Could not render config → PROBLEM (blocks any update for the pool)
**VERIFICATION REQUIREMENT:**
Before making ANY conclusion about a condition, you MUST internally state:
"Condition type='X' has status='Y'" and then interpret it correctly.
**NEVER assume a condition is true just because the type exists - ALWAYS check the status field!**
**The presence of a condition type does NOT mean it is active - check the status field!**
</condition_checking_guide>

<critical_analysis_requirements>
### 1. Available Updates and Conditional Updates Analysis
**Available updates (status.availableUpdates):**
- Count EXACTLY how many items are in status.availableUpdates array.
- For each entry, extract: version, image, channels[], url (errata).
- Identify the latest recommended z-stream and the latest recommended y-stream (if any).
**Conditional updates (status.conditionalUpdates) — REQUIRED:**
- Count EXACTLY how many items are in status.conditionalUpdates array.
- For each conditional update, locate the conditions[] entry with type="Recommended":
  - If status="False": the cluster matches a known risk for this target. Extract:
    - Target release.version and release.image
    - The reason and message from the Recommended condition
    - All risks[] entries: name, message, url (Red Hat KCS or bug link)
  - If status="Unknown": CVO has not finished evaluating risks yet — note as informational.
  - If status="True": cluster does NOT match any risk for this target — treat as effectively recommended.
- Conditional update presence with Recommended=False is NOT itself an upgrade blocker, but it IS a risk the administrator must explicitly accept; surface it prominently.

### 2. ClusterVersion Conditions - VERIFICATION REQUIRED
For each of the following, locate the condition in status.conditions[], read the status field, and interpret per <condition_checking_guide>. Quote the actual reason and message if reporting a problem.
a) **Failing**: status="True" → reconciliation failure, report reason and message.
b) **Upgradeable**: status="False" → upgrades are explicitly blocked; report reason and message verbatim. Common reasons include AdminAckRequired, MultipleReasons, operator-specific reasons.
c) **Available**: status="False" → cluster operationally impaired.
d) **Progressing**: status="True" AND not currently in an admin-initiated upgrade → may indicate a stuck reconciliation.
e) **RetrievedUpdates**: status="False" → Cincinnati/update service unreachable; cluster cannot discover updates.
f) **ReleaseAccepted**: status="False" → desired release image was rejected (signature verification, manifest validation, or image pull failure).
g) **ImplicitlyEnabledCapabilities**: status="True" → a capability disabled in spec was implicitly enabled; surface as informational warning.

### 3. Admin-Ack Gate Analysis (CRITICAL FOR MINOR UPGRADES)
OpenShift requires administrators to acknowledge specific upgrade gates before minor-version upgrades. CVO sets Upgradeable=False with reason=AdminAckRequired until all applicable gates are acknowledged.
Procedure:
- Read keys from ConfigMap admin-gates in namespace openshift-config-managed. These are the gate keys the cluster's components have declared (example key shape: ack-4.13-kube-1.27-api-removals-in-4.14).
- Read keys from ConfigMap admin-acks in namespace openshift-config. An acknowledgement is valid only if the value is the literal string "true".
- For each key in admin-gates:
  - If the same key exists in admin-acks with value "true" → ACKNOWLEDGED.
  - If missing OR value is anything other than "true" → NOT ACKNOWLEDGED, and minor upgrade is blocked until administrator runs:
    'oc -n openshift-config patch cm admin-acks --patch '{"data":{"<gate-key>":"true"}}' --type=merge'
- Report each unacknowledged gate by its exact key name. Do NOT invent gate keys; only report what is actually present in admin-gates.
- If admin-gates is empty or absent → no current admin-ack gates apply.
- If either ConfigMap is unreadable, note it explicitly and indicate that gate state cannot be confirmed.

### 4. ClusterOperator Health Check (per-operator condition matrix)
For each ClusterOperator, check status.conditions[]. Report as upgrade-impacting only when status fields match these patterns:
- Available=False → BLOCKER. Operator is down, will block its phase of the upgrade.
- Degraded=True → WARNING/POTENTIAL BLOCKER. Operator is reconciling with errors. If Available=True, upgrade may still proceed but with risk; if Available=False as well, treat as blocker.
- Upgradeable=False → BLOCKER for minor (and sometimes z-stream) upgrades. Report exact reason and message.
- Progressing=True for an extended period (no admin-initiated upgrade in flight) with error messages → POTENTIAL BLOCKER (stuck reconciliation).
**Pay special attention to these critical operators** (failures here are upgrade-blocking by nature):
- cluster-version (the CVO itself)
- etcd — quorum and member health gate the entire control plane upgrade
- kube-apiserver, kube-controller-manager, kube-scheduler — revision rollouts must converge before next phase
- openshift-apiserver
- machine-config — drives node-side updates
- machine-api — provisions/replaces nodes
- authentication
- network — SDN/OVN health is required for any rolling reboot
- dns
- ingress
- monitoring
- image-registry
- storage and any CSI driver operators
For each problematic operator, report: name, the failing condition (type and status), the reason, and the message.

### 5. MachineConfigPool Status (Node Rollout Readiness)
For each MachineConfigPool (focus on master and worker, plus any custom pools):
- spec.paused == true → Pool is paused. Paused master pool is almost always wrong. Paused worker pool is acceptable only as part of a documented EUS upgrade workflow; flag it for administrator awareness because paused pools block node-level updates and inhibit certificate rotation.
- status.conditions[]:
  - Degraded=True → BLOCKER for that pool's node updates. Report message.
  - NodeDegraded=True → BLOCKER. A node in the pool failed to apply config; identify the node from the message.
  - RenderDegraded=True → BLOCKER. The MCO cannot render a valid config for the pool.
  - Updated=False AND Updating=False → Pool has pending changes but is not progressing — investigate.
- Configuration drift: If status.observedGeneration != metadata.generation, the pool is behind; mention if the gap is significant.
- status.machineCount, status.readyMachineCount, status.updatedMachineCount, status.degradedMachineCount — report if degradedMachineCount > 0 or if readyMachineCount < machineCount outside an active upgrade.

### 6. Node Health and Resource Pressure
a) **Node Readiness and Pressure** (per Node, from status.conditions):
   - Ready=False or Ready=Unknown → BLOCKER. The node cannot drain, reboot, and rejoin during a rolling update. Report node name and the condition's reason and message.
   - MemoryPressure=True → BLOCKER/WARNING. Pods will be evicted and reschedule may not converge during upgrade surge; flag node name.
   - DiskPressure=True → BLOCKER. Image pulls for new release content will fail. Flag node name and check /var/lib/containers if message indicates.
   - PIDPressure=True → BLOCKER.
   - NetworkUnavailable=True → BLOCKER.
   - spec.unschedulable=true (cordoned) outside an active drain → flag for administrator awareness.
b) **Resource Utilization** (using nodes_top, optional):
   - Flag any node with CPU usage > 90% or memory usage > 90%.
   - Explain impact: Rolling upgrades require surge capacity (control-plane revisions roll one node at a time; worker pools drain one node at a time). Saturated nodes can prevent successful drain and pod rescheduling.
   - For control-plane nodes, memory pressure is especially impactful because etcd is sensitive to I/O contention.

### 7. PodDisruptionBudget Analysis (User Workload Drain Blockers)
PDBs become upgrade-relevant because the MachineConfigOperator drains worker nodes one at a time during rolling updates. A PDB that does not allow eviction will block the drain indefinitely.
Procedure:
- Query PDBs in ALL namespaces EXCEPT OpenShift system namespaces:
  - All namespaces with prefix openshift-
  - All namespaces with prefix kube-
  - Namespaces default and openshift
- For each remaining (user workload) PDB, evaluate as a drain blocker if ANY of the following are true:
  - status.disruptionsAllowed == 0 AND status.currentHealthy <= status.desiredHealthy (eviction blocked right now)
  - spec.minAvailable equals 100% (or equals status.expectedPods) — no pod can be evicted
  - spec.maxUnavailable == 0 — explicitly forbids any disruption
  - The PDB selector matches zero pods (status.expectedPods == 0) AND minAvailable >= 1 — misconfigured, will block drain
- For each problematic PDB, report: namespace, name, the offending field, and status.disruptionsAllowed.
- Ignore all PDBs in OpenShift system namespaces — these are managed by Red Hat.
- If no problematic user workload PDBs exist, state "No problematic user workload PDBs found".

### 8. Update Path Validation
a) **Channel correctness**:
   - Read spec.channel (e.g., stable-4.21, fast-4.21, eus-4.18).
   - Check status.desired.channels[] for channels available for the current version.
   - If spec.channel is not present in status.desired.channels AND RetrievedUpdates=False, the channel may be invalid for this version — flag it.
b) **Skip-level detection**:
   - Examine status.history[0].version (current) vs any administrator-mentioned target.
   - OpenShift does NOT support skipping minor versions (e.g., 4.18 → 4.20 directly). Upgrades must go through each intermediate minor, except via the EUS-to-EUS path where worker pools are paused.
   - If the latest available update or conditional update is more than one minor ahead of the current version, surface this as an informational note about path constraints.
c) **EUS path indicators**:
   - If spec.channel starts with eus-, note that the cluster is on the EUS path and that worker MCP pause/unpause is part of the workflow.

### 9. Deprecated API Usage (Affects Minor Upgrades)
If the APIRequestCount resource is available on this cluster (apiserver.openshift.io/v1):
- List APIRequestCount objects.
- For each, read status.removedInRelease. If a removal release is set AND the upcoming minor target matches or exceeds it:
  - Read status.currentHour.byUser[] and status.last24h[].byUser[] to identify which clients are still calling the API.
  - Report: API name (e.g., flowschemas.v1beta2.flowcontrol.apiserver.k8s.io), removedInRelease, and a deduplicated list of top callers (username and userAgent).
- If no deprecated APIs are in use OR none are removed by the target release → state so explicitly.
- If APIRequestCount is unavailable, skip with a note.

### 10. Pending CertificateSigningRequests
During upgrades, nodes that reboot must have their kubelet client and serving certificates approved. A backlog of pending CSRs can prevent nodes from rejoining the cluster.
- List CertificateSigningRequest objects.
- Filter to those with no Approved condition AND no Denied condition (i.e., still pending) OR with status.certificate empty.
- Group by spec.signerName (e.g., kubernetes.io/kube-apiserver-client-kubelet, kubernetes.io/kubelet-serving).
- If 5 or more node-related CSRs are pending, flag as a node rejoin risk and report counts and signer names.
- Pending CSRs unrelated to nodes (custom signers) can be ignored unless explicitly tied to upgrade workflows.

### 11. MachineHealthCheck Status
Active MachineHealthChecks can interfere with upgrades by remediating nodes that are intentionally drained or rebooted as part of the upgrade. Red Hat documentation recommends pausing MHCs during upgrades.
- List MachineHealthChecks.
- For each, check metadata.annotations["cluster.x-k8s.io/paused"] or metadata.annotations["machine.openshift.io/cluster-api-cluster"] paused-style annotations. Different OCP versions use different paused annotations; if any pause annotation is present, treat as paused.
- Report MHCs that are NOT paused and target node sets that will roll during the upgrade — surface as a recommendation, not a blocker.

### 12. OLM Subscription Health (Layered Operators)
Layered operators installed via OLM must be on a channel/version compatible with the target OpenShift release before upgrade.
- List Subscriptions.
- For each Subscription, examine status.conditions[]:
  - CatalogSourcesUnhealthy=True → operator catalog cannot be reached (will block any operator updates)
  - InstallPlanFailed=True or ResolutionFailed=True → operator cannot install/update; flag the operator
  - InstallPlanPending=True AND not progressing → manual approval may be required before upgrade
- Report by namespace and Subscription name. Do not flag healthy Subscriptions.

### 13. Cluster Capabilities Assessment
- Extract enabled capabilities from status.capabilities.enabledCapabilities.
- Extract known capabilities from status.capabilities.knownCapabilities.
- Disabled capabilities = known minus enabled. Note these.
- If ImplicitlyEnabledCapabilities=True, surface that the upgrade target implicitly enables a capability that was disabled in spec.capabilities.
- Capabilities themselves are rarely upgrade blockers, but capability transitions can change which operators are reconciled.

### 14. Cincinnati Update Service Health
- spec.upstream: if set, the cluster uses a custom update service; if unset, default Red Hat update service is used.
- Verify RetrievedUpdates condition: status, lastTransitionTime, message.
- If status.availableUpdates is empty AND RetrievedUpdates=True → cluster is on the latest known version in its channel.
- If status.availableUpdates is empty AND RetrievedUpdates=False → update discovery is broken.
- spec.clusterID: report for telemetry context.
- spec.signatureStores: if present, custom signature stores are configured (relevant for disconnected clusters and ReleaseAccepted failures).

### 15. Cluster Version History Context
- Initial version: status.history[] last entry (oldest).
- Most recent completed upgrade: most recent status.history[] entry with state="Completed".
- Any state="Partial" entries indicate failed or interrupted upgrades — surface them.
- Cluster age: derive from oldest history entry's startedTime or completionTime.

### 16. Configuration Overrides
- Review spec.overrides[]. Each entry with unmanaged=true means the CVO will not reconcile that resource.
- Overrides are not upgrade blockers per se, but they can mask drift and cause post-upgrade inconsistencies. Surface any overrides as informational.

### 17. Recent Events Analysis (Upgrade-Relevant Only)
- Query events from last 30 minutes, type Warning or higher.
- Restrict to upgrade-relevant namespaces: openshift-cluster-version, openshift-machine-config-operator, openshift-etcd, openshift-kube-apiserver, openshift-apiserver, openshift-authentication, openshift-network-operator, openshift-monitoring.
- Group by reason and involvedObject to avoid noise.
- Translate technical reasons into plain language:
  - ImagePullBackOff → "Operator pod cannot pull its container image — check registry connectivity or pull secrets"
  - FailedScheduling → "Operator pod cannot be scheduled — check node taints, resources, or selectors"
  - Unhealthy (for etcd) → "etcd member health check failing — investigate before upgrading"
- Skip events unrelated to upgrade readiness.

### 18. Active Alerts (Optional)
If get_alerts is available:
- Focus on severity=critical and severity=warning.
- Prioritize alerts whose names indicate upgrade impact, including but not limited to: ClusterNotUpgradeable, ClusterOperatorDown, ClusterOperatorDegraded, KubeAPIDown, etcdMembersDown, etcdInsufficientMembers, KubePersistentVolumeFillingUp, NodeFilesystemSpaceFillingUp, KubeNodeNotReady, MachineConfigDaemonReboot-style alerts.
- Translate each fired alert into an actionable recommendation.
- If get_alerts is unavailable, skip this section.
</critical_analysis_requirements>

<output_format>
## Summary
**Update Service Health**
- **Cincinnati Service**: [spec.upstream URL if configured, otherwise "Default Red Hat update service"]
- **Service Status**: [RetrievedUpdates condition status and message]
- **Last Update Check**: [From RetrievedUpdates condition lastTransitionTime]
- **Update Channel**: [Current spec.channel]
- **Channel Validity**: [Confirmed valid for current version, or flagged as not in status.desired.channels]
- **Cluster ID**: [spec.clusterID]
**Cluster History Context**
- **Initial Version**: [First entry from status.history with date]
- **Upgrade Path**: [Recent version progression from history]
- **Last Completed Upgrade**: [Most recent Completed entry with timeframe]
- **Partial/Failed Upgrade History**: [Any Partial entries, otherwise "None"]
- **Cluster Age**: [Time since initial installation]
**Available Updates**
- **Recommended Updates**: [Count from status.availableUpdates with versions]
- **Conditional Updates**: [Count from status.conditionalUpdates]
- **Conditional Update Risk Analysis**: For each conditional update with Recommended=False, list:
  - Target version, risk name, risk message, reference URL
  - Otherwise: "No conditional update risks apply to this cluster"
**Upgrade Readiness Assessment**

YOU MUST explicitly state the status field value for each condition you check.
**ClusterVersion Conditions:**
- **Failing**: [type="Failing" found with status="X"] → [interpretation]
- **Upgradeable**: [type="Upgradeable" found with status="X" OR not found] → [interpretation, including reason and message if status="False"]
- **Available**: [type="Available" found with status="X"] → [interpretation]
- **Progressing**: [type="Progressing" found with status="X"] → [interpretation; only flag if stuck and not in admin-initiated upgrade]
- **RetrievedUpdates**: [status="X"] → [interpretation]
- **ReleaseAccepted**: [status="X"] → [interpretation]
- **ImplicitlyEnabledCapabilities**: [status="X"] → [interpretation]
**Admin-Ack Gates (Minor Upgrade Prerequisite):**
- **Defined Gates** (from openshift-config-managed/admin-gates): [list of keys, or "None"]
- **Acknowledged** (from openshift-config/admin-acks with value "true"): [list of keys]
- **Outstanding Gates Blocking Minor Upgrade**: [list of keys not acked, or "None — all gates satisfied"]
- **Action**: For each outstanding gate, provide the exact oc patch command using the actual key name.
**ClusterOperator Health:**
- **Total Operators**: [count]
- **Operators With Issues**: For each problematic operator, report:
  - Name
  - Failing condition (type and status)
  - Reason and message
- If none: "All ClusterOperators report Available=True, Degraded=False, Upgradeable=True"
**Infrastructure Health:**
- **MachineConfigPools**: For each pool, report state. Flag Degraded=True, NodeDegraded=True, RenderDegraded=True, paused=true, or readyMachineCount < machineCount outside active upgrade.
- **Node Status**: Count of NotReady nodes with names and reasons. Count of nodes with MemoryPressure/DiskPressure/PIDPressure/NetworkUnavailable.
- **Resource Pressure**: From nodes_top, list nodes with >90% CPU or memory.
- **Pending CSRs**: Count and signer names if 5 or more pending node-related CSRs.
- **MachineHealthChecks**: Count of unpaused MHCs (informational recommendation).
- **User Workload PDBs**: Count of problematic non-OpenShift PDBs that could block node draining, with namespace/name and the offending field.
**Deprecated API Usage:**
- **Deprecated APIs Removed In Target**: For each, report API name, removedInRelease, and top callers (username/userAgent).
- If none or APIRequestCount unavailable: state explicitly.
**Layered Operator Health (OLM):**
- **Subscriptions With Issues**: For each, namespace and Subscription name with the failing condition (CatalogSourcesUnhealthy, InstallPlanFailed, ResolutionFailed, etc.).
- If none: "All Subscriptions healthy"
**Recent Events** (Last 30 minutes, upgrade-relevant namespaces):
- **Critical Events**: Count and grouped descriptions.
- **Warning Events**: Count and grouped descriptions.
- **User-Friendly Summary**: Translate technical events into plain language.
- If none: "No recent errors or warnings detected in upgrade-relevant components"
**Active Alerts** (if available):
- **Critical Alerts**: Count and names.
- **Warning Alerts**: Count and names.
- **Impact on Upgrade**: For each, explain effect on upgrade readiness.
- If unavailable: skip section.
**Configuration:**
- **Overrides**: Any spec.overrides entries with unmanaged=true.
- **Capabilities**: Enabled count, disabled-but-known count with names, ImplicitlyEnabledCapabilities note if applicable.
**Final Assessment:**
Based ONLY on issues identified above:
- If no upgrade-blocking conditions and no unaccepted conditional risks: "Cluster appears ready for upgrade."
- If only conditional update risks or warnings (no hard blockers): "Cluster can upgrade after administrator review of: [list]. No hard blockers."
- If hard blockers present: "Upgrade blocked — must resolve [list of specific blockers] first."
A "hard blocker" means at least one of:
- ClusterVersion Upgradeable=False
- ClusterVersion Failing=True
- ClusterVersion ReleaseAccepted=False
- Any ClusterOperator with Available=False or Upgradeable=False
- Any MachineConfigPool with Degraded=True, NodeDegraded=True, or RenderDegraded=True
- Any node with Ready=False (other than transient and self-recovering)
- Any user-workload PDB blocking eviction (disruptionsAllowed=0 with no surge capacity)
- Outstanding admin-ack gate (only blocks minor upgrades, not z-stream)
- Deprecated API in active use that is removed in target minor
## TL;DR
- **Current Version**: ${currentVersion}
- **Available Updates**: [count from status.availableUpdates]
- **Latest Recommended Update**: [version with channels]
- **Conditional Updates**: [count] ([N with Recommended=False risks applying to this cluster])
- **Update Channel**: [current spec.channel] ([valid / not in status.desired.channels])
- **Channel Options**: [available channels for current version]
- **Capabilities**: [enabled count / disabled count with names]
- **Initial Version**: [from history with date]
- **Last Upgrade**: [most recent completed upgrade with date]
- **Cincinnati Health**: [service status with timestamp]
- **Admin-Ack Gates**: [satisfied | N outstanding: list of keys]
- **Upgrade Blocked**: [Yes | No — only "Yes" if a hard blocker per definition above is present]
- **Upgrade Blockers**: [specific list with status field values, or "No blockers"]
- **Conditional Risks To Acknowledge**: [risk names with target versions, or "None"]
- **Unhealthy ClusterOperators**: [count and names with the failing condition]
- **Degraded MCPs**: [count and names with failing condition]
- **Paused MCPs**: [names if any]
- **Node Issues**: [count of NotReady or pressure-affected nodes with names]
- **Resource Pressure**: [nodes with >90% CPU or memory]
- **User Workload PDBs Blocking Drain**: [count with namespace/name]
- **Pending Node CSRs**: [count if >= 5, else omit or "None significant"]
- **Deprecated APIs In Use**: [count removed in target, with API names]
- **Layered Operator Issues**: [count of unhealthy Subscriptions]
- **Recent Events**: [count of upgrade-relevant errors/warnings in last 30 min]
- **Active Alerts**: [count of critical/warning, skip if unavailable]
- **Configuration Issues**: [overrides or capability concerns]
- **Recommendation**: [Proceed with upgrade | Address warnings first | Blocked — resolve listed issues]
</output_format>`;
};

/**
 * Generate precheck prompt for specific target version
 */
