import { getLanguageConstraint } from './shared/language-utils';

/**
 * Pre-check prompt for clusters with no available updates
 * Verifies cluster health when already at latest version
 *
 * @param currentVersion - Current cluster version
 * @returns Formatted prompt for OLS health verification
 */
export const createPreCheckNoUpdatesPrompt = (currentVersion: string) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Health Assessment

<constraints>
- YOU MUST ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU MUST ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
- Use resources_get to fetch the ClusterVersion resource (apiVersion: "config.openshift.io/v1", kind: "ClusterVersion", name: "version")
- Use resources_list to fetch all ClusterOperator resources (apiVersion: "config.openshift.io/v1", kind: "ClusterOperator")
- Assess ONLY the actual cluster state from tool call data
- Distinguish between system health and user workload issues
- Provide actionable recommendations for administrators
- ONLY OUTPUT the Summary and TL;DR sections
${languageConstraint}
</constraints>

<context>
Health assessment for OpenShift cluster running ${currentVersion} with no available updates. You have complete cluster data including ClusterVersion and all ClusterOperator resources for comprehensive health analysis.
Focus on operational health and readiness for future updates.
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
- {type: "RetrievedUpdates", status: "True"} means updates were retrieved (healthy)
- {type: "RetrievedUpdates", status: "False"} means update retrieval failed (problem)
- {type: "Failing", status: "False"} means the cluster is NOT failing (healthy)
- {type: "Available", status: "True"} means the cluster IS available (healthy)
**NEVER assume a condition is true just because the type exists - ALWAYS check the status field!**
</condition_checking_guide>

<health_assessment_requirements>

1. **Current Version and Update Status Analysis** (Check BOTH type AND status):
 - Extract and confirm current version from status.desired.version matches ${currentVersion}
 - Verify status.availableUpdates array is empty (confirming no updates available)
 - Find condition where type="RetrievedUpdates" AND status="True" (confirms update service is working)
 - Analyze why no updates are available (end of channel, latest version, etc.)

2. **Cluster Capabilities Configuration Assessment**:
 - Extract enabled capabilities from status.capabilities.enabledCapabilities
 - Extract known capabilities from status.capabilities.knownCapabilities
 - Identify disabled capabilities (known but not enabled)
 - Assess capability configuration health and consistency
 - Check spec.capabilities.baselineCapabilitySet and additionalEnabledCapabilities

3. **Update Service and Channel Health**:
 - Check spec.upstream (if configured) or note "using default Red Hat update service"
 - Verify status.conditions for type="RetrievedUpdates" status and timestamp
 - Confirm update service connectivity is working despite no available updates
 - Current channel from spec.channel
 - Cluster ID for telemetry (spec.clusterID)
 - Signature verification status (spec.signatureStores if present, otherwise default stores)

4. **Cluster Version History Context**:
 - Extract initial cluster version from status.history (first entry)
 - Identify upgrade path from history entries
 - Last completed upgrade and timeframe
 - Total cluster age and upgrade frequency
 - Historical upgrade success pattern

5. **System Component Health** (Check BOTH type AND status for each operator):
 For each ClusterOperator, check conditions:
 - **Available**: If type="Available" AND status="False" → Requires immediate intervention
 - **Degraded**: If type="Degraded" AND status="True" → Degraded state, lower quality of service
 - **Progressing**: If type="Progressing" AND status="True" with errors → Component stuck
 - **Upgradeable**: If type="Upgradeable" AND status="False" → Blocks minor upgrades
 - Verify core platform operators (console, authentication, ingress, etc.) are healthy
 - Check ClusterVersion status.conditions for overall cluster health
 - Report specific operator names and their condition messages for problematic conditions only
 - IMPORTANT: Available=True, Degraded=False, Upgradeable=True are healthy states

6. **Future Update Readiness Assessment** (Check BOTH type AND status):
 - Find condition where type="Upgradeable" (OPTIONAL - may not exist)
 * If found AND status="False": This IS an upgrade blocker - report reason
 * If status="True", missing, or status="Unknown": Future upgrades are allowed
 - Find condition where type="Failing"
 * If found AND status="True": Cluster issues that must be resolved
 * If status="False" or missing: No failing condition (healthy)
 - Review spec.overrides for any unmanaged components that might block future upgrades
 - Identify maintenance items to address proactively
 - User workload PDB analysis for potential upgrade blockers

7. **Operational Health and Recommendations**:
 - Identify issues that affect user applications
 - Focus on problems that cluster administrators can/should address
 - Provide specific, actionable guidance for maintaining cluster health
 - Distinguish from normal system maintenance activities
 - Avoid recommendations for normal system behavior

</health_assessment_requirements>

<output_format>
## Summary
**Overall Health Status**
[Assessment based on actual cluster state data]
**System Component Status**
- **Core Services**: [List core platform operators and their health status]
- **Degraded Operators**: [Any operators with Available=False or Degraded=True]
- **Progressing Operators**: [Operators currently updating or progressing]
- **Infrastructure**: [Overall cluster-level status and configuration]
**Administrator Action Items**
- **Immediate**: [Issues requiring prompt attention]
- **Maintenance**: [Items to address during maintenance windows]
- **Monitoring**: [Things to watch for trends]
**Future Update Readiness**
[Assessment of readiness for next OpenShift updates]

## TL;DR
- **Overall Status**: [Healthy | Minor issues | Attention needed]
- **System Health**: [Count of healthy vs degraded operators]
- **Core Platform**: [Status of essential operators: console, authentication, ingress, etc.]
- **Degraded Components**: [Count and names of any unhealthy operators]
- **User Impact**: [Any operator issues affecting workloads]
- **Action Items**: [Count of items needing administrator attention]
- **Update Readiness**: [Ready | Operator issues need resolution]
- **Next Review**: [Recommended reassessment timeframe]
</output_format>`;
};
