import {
  PROMPT_TIMEOUT_TOTAL_LIMIT,
  PROMPT_TIMEOUT_WARNING_THRESHOLD,
  PROMPT_TIMEOUT_MAX_EXECUTION,
} from './shared/constants';
import { getLanguageConstraint } from './shared/language-utils';

/**
 * Pre-check prompt for a specific target version
 * Validates upgrade path and version-specific requirements
 *
 * @param currentVersion - Current cluster version
 * @param targetVersion - Specific target version selected by user
 * @returns Formatted prompt for OLS version-specific assessment
 */
export const createPreCheckSpecificVersionPrompt = (
  currentVersion: string,
  targetVersion: string,
) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Upgrade Pre-Check Analysis

<constraints>
${languageConstraint}

- YOU MUST ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU MUST ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
**CRITICAL: Timeout and Error Handling**
**Timeout Awareness:**
- You have a ${PROMPT_TIMEOUT_TOTAL_LIMIT}-second timeout - manage your time wisely
- Prioritize essential data (ClusterVersion, ClusterOperators) first
- Track execution time and stop making new tool calls after ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds
- Provide analysis with available data rather than timing out trying to fetch everything
**Error Handling Rules:**
1. **Be specific about which tool failed**- don't give generic "cannot retrieve data" messages
2. **Explain what data you're missing**- e.g., "Unable to fetch ClusterVersion resource" vs "Unable to retrieve data"
3. **Try alternative approaches**:
 - If resources_list fails for all ClusterOperators, note this specifically
 - If nodes_top fails, continue with other analysis - it's optional
 - If get_alerts fails, skip it - alerts are optional
 - If events_list fails, continue without event data
4. **Provide partial analysis** - If you get ClusterVersion but not operators, analyze what you have
5. **Give actionable troubleshooting**when tools fail:
 - Check if OpenShift MCP server is running: 'oc get pods -n openshift-lightspeed'
 - Verify cluster connectivity
 - Suggest checking MCP server logs for specific errors
6. **NEVER give up completely**- Always provide SOME analysis even with partial data
**Tool Call Priority to Avoid Timeouts:**
**PHASE 1 - ESSENTIAL (Always fetch):**
1. resources_get: ClusterVersion (apiVersion: "config.openshift.io/v1", kind: "ClusterVersion", name: "version")
2. resources_list: ClusterOperator (apiVersion: "config.openshift.io/v1", kind: "ClusterOperator")
**PHASE 2 - IMPORTANT (Fetch if time permits, under 45 seconds total):**
3. resources_list: Node (apiVersion: "v1", kind: "Node") - Quick check for NotReady nodes
4. events_list: Get recent warning/error events from last 30 minutes - High value for diagnostics
**PHASE 3 - OPTIONAL (Only if under ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds total):**
5. resources_list: MachineConfigPool (apiVersion: "machineconfiguration.openshift.io/v1", kind: "MachineConfigPool")
6. nodes_top: Check node CPU/memory usage
7. resources_list: PodDisruptionBudget (apiVersion: "policy/v1", kind: "PodDisruptionBudget") - Filter out openshift-*, kube-*
8. get_alerts: Check for critical/warning alerts
**CRITICAL EFFICIENCY RULES:**
- If approaching ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds of execution time, STOP making new tool calls and provide analysis with data collected
- NEVER let total execution exceed ${PROMPT_TIMEOUT_MAX_EXECUTION} seconds to avoid timeout
- Prioritize breadth over depth: Get ClusterVersion + ClusterOperators fully before diving into logs/events
- Skip optional data if essential data took longer than expected

- NEVER use placeholder or dummy data - only reference real data from tool calls
- ONLY report issues that are actually present in the data
- ONLY OUTPUT the Summary and TL;DR sections
- Be specific about the source of any issues identified
- CRITICAL: When counting available updates, count ALL array elements in status.availableUpdates
- CRITICAL: Check status.conditionalUpdates for ALL versions from ${currentVersion} to ${targetVersion} (inclusive)
- CRITICAL: Analyze the COMPLETE upgrade path, not just the target version - intermediate versions matter!
</constraints>

<context>
This is a pre-upgrade analysis for OpenShift cluster upgrade from ${currentVersion} to ${targetVersion}. You have complete cluster data including ClusterVersion and all ClusterOperator resources to analyze the feasibility and safety of this specific upgrade.

**CRITICAL UPGRADE PATH ANALYSIS**: You must analyze ALL conditional update risks for every version between ${currentVersion} and ${targetVersion} (inclusive). This includes intermediate versions that may be part of the upgrade path. For example, if upgrading from 4.21.16 to 4.21.22, you must check for risks at 4.21.17, 4.21.18, 4.21.19, 4.21.20, 4.21.21, and 4.21.22. Users need to know about ALL risks they will encounter in the upgrade journey, not just risks at the final target version.
</context>

<condition_checking_guide>
CRITICAL: Understanding Kubernetes/OpenShift Conditions

Conditions have TWO important fields you MUST check:
- **type**: The name of the condition (e.g., "Failing", "Available", "Progressing")
- **status**: The state of the condition ("True", "False", or "Unknown")

**How to Correctly Check Conditions:**
- A condition is TRUE when: type="X" AND status="True"
- A condition is FALSE when: type="X" AND status="False"
- A condition is UNKNOWN when: type="X" AND status="Unknown"

**Examples:**
- {type: "Failing", status: "False"} means the cluster is NOT failing (healthy)
- {type: "Failing", status: "True"} means the cluster IS failing (problem)
- {type: "Upgradeable", status: "False"} means upgrades are blocked (problem)
- {type: "Upgradeable", status: "True"} means upgrades are allowed (healthy)
**NEVER assume a condition is true just because the type exists - ALWAYS check the status field!**
</condition_checking_guide>

<critical_analysis_requirements>

1. **Target Version Verification** (PRIORITY):
 - Look in status.availableUpdates array for ${targetVersion}
 - If found, extract its channels, url, and image information
 - If NOT found, report "${targetVersion} is not available for upgrade"

1a. **Conditional Updates Risk Analysis - All Risks Up to Target Version**:
 - **CRITICAL**: Analyze ALL conditional updates from ${currentVersion} up to and including ${targetVersion}
 - **Version Range**: Parse version numbers to identify which conditional updates fall between current and target
 - **Example**: If current=4.21.16, target=4.21.22, analyze risks for: 4.21.17, 4.21.18, 4.21.19, 4.21.20, 4.21.21, 4.21.22
 - **Why This Matters**: Users may need to upgrade through intermediate versions to reach the target, so ALL risks in the path are relevant
 - For each conditional update in the version range, analyze the conditions array:
 * Look for conditions with type="Recommended" AND status="False" (indicates risks/concerns)
 * Extract risk details from the condition message field
 * Parse URLs in the message for documentation links
 - **Risk Assessment Process** (for each version in range):
 * Identify what triggers the risk (e.g., specific cluster configurations, network plugins)
 * Determine if the risk applies to THIS cluster based on current configuration
 * Assess severity: Does this block the upgrade or just require careful planning?
 * Note which version introduces the risk (important for upgrade path planning)
 - **User-Friendly Risk Explanation**:
 * Translate technical risk messages into plain language
 * Example: "Recommended=False: OVN network disruption" → "This update may cause brief network interruptions (2-5 minutes) if your cluster uses OVN-Kubernetes networking. Plan for a maintenance window."
 * Show version where risk appears: "Risk at 4.21.18: [description]"
 - **Mitigation Recommendations**:
 * If risk applies: Suggest mitigation steps (maintenance window, backup procedures, etc.)
 * If risk doesn't apply: Clearly state "This risk does not apply to your cluster"
 * Provide decision guidance: "Safe to proceed with caution" vs "Address concerns first"
 - **Presentation Order**: List risks in version order (lowest to highest) to show the upgrade path chronologically

2. **Cluster Upgrade Readiness** (Check BOTH type AND status):
 - Find condition where type="Upgradeable" (may not exist)
 * If found AND status="False": Report the specific reason - this blocks upgrades
 * If status="True" or missing: Upgrades are allowed
 - Find condition where type="Failing"
 * If found AND status="True": Report details - this indicates problems
 * If status="False" or missing: No failing condition (healthy)
 - Find condition where type="Available"
 * If found AND status="False": Report cluster operational issues
 * If status="True": Cluster is available (healthy)

3. **ClusterOperator Health Check** (Check BOTH type AND status):
 For each ClusterOperator, check conditions:
 - Available: If type="Available" AND status="False" → Operator unavailable (blocker)
 - Degraded: If type="Degraded" AND status="True" → Operator degraded (warning)
 - Upgradeable: If type="Upgradeable" AND status="False" → Blocks upgrades (blocker)
 - Report specific operator names and their issues for problematic conditions only
 - Focus on operators that would block upgrades

4. **Current Cluster Configuration**:
 - Extract spec.channel (current update channel)
 - Extract spec.clusterID
 - Check if spec.upstream is configured (custom Cincinnati server)
 - Note status.conditions RetrievedUpdates condition

5. **User Workload PDB Analysis** (IMPORTANT - Filter System PDBs):
 - Query PodDisruptionBudgets in ALL namespaces EXCEPT these OpenShift system namespaces:
 * openshift-* (all openshift- prefixed namespaces)
 * kube-* (all kube- prefixed namespaces)
 * default, openshift
 - ONLY flag user workload PDBs where:
 * minAvailable >= 1 AND it covers critical user applications
 * maxUnavailable = 0 AND it covers critical user applications
 - IGNORE all PDBs in OpenShift system namespaces - these are managed by Red Hat
 - If no problematic user workload PDBs exist, state "No problematic user workload PDBs found"

6. **MachineConfigPool Status** (Check BOTH type AND status):
 For each MachineConfigPool:
 - Check conditions for Degraded: If type="Degraded" AND status="True" → MCP has issues
 - Check conditions for Updated: If type="Updated" AND status="False" → MCP not updated
 - Check spec.paused=true → MCP manually paused (blocks node updates)
 - Check observedGeneration ≠ metadata.generation → Configuration drift
 - Focus on master and worker MCPs which are critical for upgrade success
 - Report specific MCP names and their issues

7. **Node Health and Resource Pressure**:
 a) **Node Readiness:**
 - Check each Node for Ready condition: If type="Ready" AND status="False" → Node not ready (blocker)
 - Check for other node conditions: MemoryPressure, DiskPressure, PIDPressure (status="True" is problem)
 - Report NotReady nodes with their conditions and reasons

 b) **Resource Utilization (using nodes_top):**
 - Check CPU usage: Flag if any node >90% CPU utilization
 - Check memory usage: Flag if any node >90% memory utilization
 - Explain impact: High resource usage can slow upgrades or cause failures
 - Recommend: Consider scaling down workloads before upgrading to ${targetVersion} if resources are constrained

8. **Cincinnati Update Service Health**:
 - Check spec.upstream (if configured) or note "using default Red Hat update service"
 - Verify status.conditions for type="RetrievedUpdates" status and timestamp
 - Confirm status.availableUpdates or status.conditionalUpdates contains ${targetVersion}
 - Cluster ID for telemetry (spec.clusterID)
 - Signature verification status (spec.signatureStores if present, otherwise default stores)

9. **Recent Events Analysis** (using events_list):
 - Query recent events from last 30 minutes
 - Focus on Warning and Error type events
 - Filter for upgrade-related namespaces: openshift-cluster-version, openshift-*
 - Look for patterns: repeated errors, failing pods, configuration issues
 - **User-Friendly Explanation**: Translate technical events into plain language
 - Report only events that are relevant to upgrade readiness for ${targetVersion}
 - Group similar events to avoid overwhelming users

10. **Active Alerts Assessment** (using get_alerts - if available):
 - Query Alertmanager for active alerts
 - Focus on Critical and Warning severity alerts
 - **Upgrade Impact Analysis**:
 * Critical alerts → Likely upgrade blockers, must resolve first
 * Warning alerts → May cause issues, recommend resolving
 * Info alerts → Monitor but don't block
 - **User-Friendly Translation**: Explain what each alert means in simple terms
 - Provide actionable recommendations for each alert
 - If get_alerts tool not available: Skip this check (gracefully handle tool absence)

</critical_analysis_requirements>

<output_format>
## Summary

Provide a clear assessment based ONLY on real data from tool calls (resources_get and resources_list). Be specific about:
- **Whether ${targetVersion} is available for upgrade** (found in status.availableUpdates or status.conditionalUpdates)
- **ALL conditional update risks in the upgrade path from ${currentVersion} to ${targetVersion}** (analyze status.conditionalUpdates for ALL versions in range)
- **Current cluster upgrade readiness** (check Upgradeable=False, Failing=True, degraded operators)
- **Any problematic USER WORKLOAD PDBs** (not OpenShift system PDBs)
- **Infrastructure issues**that would prevent the upgrade to ${targetVersion}

**CRITICAL INSTRUCTION**: Parse version numbers from status.conditionalUpdates and identify which versions fall between ${currentVersion} and ${targetVersion}. Report risks for ALL of these versions, not just ${targetVersion}.

**Target Version Analysis**
- **Availability**: [Whether ${targetVersion} is in availableUpdates or conditionalUpdates]
- **Channels**: [Channels available for ${targetVersion}]
- **Release Information**: [URL and metadata for ${targetVersion} if available]

**Conditional Updates Risk Analysis - Upgrade Path from ${currentVersion} to ${targetVersion}**:
- **Version Range Analyzed**: [List all versions between ${currentVersion} and ${targetVersion} that have conditional update risks]
- **Total Risks in Upgrade Path**: [Count of all risk conditions across all versions in the range]
- **Risk Details by Version** (in chronological order from lowest to highest version):

 For each version with risks in the upgrade path:
 * **Version**: [e.g., 4.21.18]
 * **Risk Conditions**: [List conditions with Recommended=False for this version]
   - Risk: [Human-readable risk description from condition message]
   - Applies to this cluster: [Yes/No with explanation]
   - Severity: [Blocker / Requires Planning / Minor Concern]
   - Mitigation: [Specific steps to address this risk]
   - Documentation: [URL from message if available]

- **Cumulative Risk Assessment for Upgrade Path**:
 * If no risks in path: "No conditional update risks from ${currentVersion} to ${targetVersion}"
 * If risks don't apply: "Conditional updates exist but risks do not apply to this cluster configuration"
 * If risks apply but manageable: "Upgrade path has manageable risks - schedule maintenance window and review all mitigations"
 * If risks are severe: "Review all risks carefully before proceeding - multiple versions in upgrade path have concerns"
 * **Planning Guidance**: "You will encounter [X] risk conditions across [Y] versions in the upgrade path from ${currentVersion} to ${targetVersion}"

**Upgrade Readiness Assessment**

YOU MUST explicitly state the status field value for each condition you check:
**ClusterVersion Conditions:**
- **Failing Condition**: [type="Failing" found with status="X"] → [Interpretation: if status="False" then NOT failing/healthy, if status="True" then failing/problem]
- **Upgradeable Condition**: [type="Upgradeable" found with status="X" OR not found] → [Interpretation: if status="False" then upgrades blocked, if status="True" or missing then upgrades allowed]
- **Available Condition**: [type="Available" found with status="X"] → [Interpretation: if status="True" then available/healthy, if status="False" then not available/problem]
**ClusterOperator Health:**
- Verify ClusterOperator resources in config.openshift.io/v1 API group
- For each operator, check status.conditions and explicitly state status field values
- Flag operators with: Available status="False" OR Degraded status="True" OR Upgradeable status="False"
- Include their message and reason fields
**Infrastructure Health:**
- **MachineConfigPools**: [Count and status of MCPs - report Degraded, Paused, or out-of-sync pools]
- **Node Status**: [Count NotReady nodes with their reasons]
- **Resource Pressure**: [From nodes_top - report nodes with >90% CPU or memory usage]
- **User Workload PDBs**: [Count of problematic non-OpenShift PDBs that could block node draining]
**Cincinnati Update Service Health**:
- **Service Configuration**: [spec.upstream URL if configured, otherwise "Default Red Hat update service"]
- **Service Status**: [RetrievedUpdates condition status and message]
- **Last Update Check**: [From RetrievedUpdates condition lastTransitionTime]
- **Update Channel**: [Current spec.channel]
- **Cluster ID**: [spec.clusterID for telemetry]
**Recent Events** (Last 30 minutes):
- **Critical Events**: [Count and description of error events]
- **Warning Events**: [Count and description of warning events]
- **User-Friendly Summary**: [Translate technical events into plain language explanation]
- **Example**: "3 ImagePullBackOff events in openshift-authentication - operator unable to download container images"
- If no concerning events: "No recent errors or warnings detected"
**Active Alerts** (if available):
- **Critical Alerts**: [Count and names of firing critical alerts]
- **Warning Alerts**: [Count and names of firing warning alerts]
- **Impact on Upgrade**: [Explain how these alerts affect upgrade readiness to ${targetVersion}]
- **User-Friendly Explanation**: [Translate alert names into actionable recommendations]
- **Example**: "KubePersistentVolumeFillingUp: Storage volume is 85% full - free up space before upgrading"
- If alerts not available: Skip this section

**Final Assessment**:
If ${targetVersion} is available and no critical issues are found:
- If no conditional risks in upgrade path: Clearly state the cluster appears ready for upgrade to ${targetVersion}
- If conditional risks exist but don't apply: State the upgrade path is clear despite conditional updates existing
- If conditional risks apply: Explain ALL risks across the upgrade path and provide comprehensive mitigation guidance

**Upgrade Path Summary**:
- List ALL versions with conditional update risks between ${currentVersion} and ${targetVersion}
- For multi-hop upgrades, clarify that risks at intermediate versions will be encountered
- Provide consolidated recommendation considering ALL risks in the path, not just target version

If ${targetVersion} is not available, recommend the closest available version and analyze risks for that path instead.

## TL;DR
- **Current Version**: ${currentVersion}
- **Target Version**: ${targetVersion}
- **Target Available**: [Yes in availableUpdates / Yes in conditionalUpdates with risks / No]
- **Upgrade Path**: [${currentVersion} → ${targetVersion}, list intermediate versions if applicable]
- **Conditional Risks in Upgrade Path**: [Total count of risk conditions across ALL versions from ${currentVersion} to ${targetVersion}, or "None"]
- **Versions with Risks**: [List versions in upgrade path that have conditional update risks, e.g., "4.21.18, 4.21.20" or "None"]
- **Risks Apply to Cluster**: [Yes/No - if ANY conditional risks in upgrade path apply to this cluster configuration]
- **Risk Severity**: [If risks exist: Blocker / Requires Planning / Minor Concern / Does Not Apply]
- **Target Channels**: [Channels for ${targetVersion} if available]
- **Current Channel**: [spec.channel from ClusterVersion]
- **Cincinnati Health**: [Update service status, e.g., "Default service healthy (RetrievedUpdates=True)" or "Custom upstream: URL (status)"]
- **Upgrade Blocked**: [Yes if blocked / No if not blocked - ONLY report "Yes" if: Upgradeable condition has status="False" OR Failing condition has status="True" OR operators have Available status="False" or Upgradeable status="False"]
- **Upgrade Blockers**: [if blockers exist with specific reason - MUST include the actual status field value you read, e.g., "Upgradeable condition status=False: reason message" OR "No blockers - all conditions healthy"]
- **Unhealthy ClusterOperators**: [count and names if any]
- **User Workload PDBs**: [count of problematic NON-OpenShift PDBs]
- **Degraded MCPs**: [count and names if any]
- **Node Issues**: [count of NotReady nodes if any, include Ready=False reason]
- **Resource Pressure**: [nodes with >90% CPU or memory usage]
- **Recent Events**: [count of error/warning events in last 30 min, user-friendly summary]
- **Active Alerts**: [count of critical/warning alerts, skip if tool unavailable]
- **Recommendation**: [Proceed with upgrade to ${targetVersion} | Address risks/warnings first | Blocked - resolve issues | Target not available - use X.X.X instead]
</output_format>`;
};

/**
 * Generate health assessment prompt for cluster with no available updates
 */
