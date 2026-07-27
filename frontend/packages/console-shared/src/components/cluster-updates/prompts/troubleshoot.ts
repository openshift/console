import {
  PROMPT_TIMEOUT_TOTAL_LIMIT,
  PROMPT_TIMEOUT_WARNING_THRESHOLD,
  PROMPT_TIMEOUT_PHASE_2_THRESHOLD,
  PROMPT_TIMEOUT_PHASE_1_TARGET,
  PROMPT_TIMEOUT_MAX_EXECUTION,
  PROMPT_TIMEOUT_LOG_TAIL_LINES,
  PROMPT_TIMEOUT_LOG_TAIL_LINES_FULL,
} from './shared/constants';
import { getLanguageConstraint } from './shared/language-utils';
import { securityConstraint, getConfidenceQualifiers } from './shared/security-utils';

/**
 * Troubleshoot prompt for failing or stalled cluster updates
 * Used when upgrade failures or component degradation is detected
 *
 * @param currentVersion - Current cluster version
 * @param desiredVersion - Target version for the failed upgrade
 * @returns Formatted prompt for OLS troubleshooting assistance
 */
export const createTroubleshootPrompt = (currentVersion: string, desiredVersion: string) => {
  const languageConstraint = getLanguageConstraint();
  const confidenceQualifiers = getConfidenceQualifiers({
    highConfidenceData: 'ClusterVersion + ClusterOperators + pod logs',
    highConfidenceQuality: 'root cause is clear',
    moderateConfidenceMissing: 'pod logs, events, nodes, alerts',
    limitedDataSuffix: 'the diagnosis may be incomplete',
    additionalGuidance: `Apply confidence to root cause claims:
- When identifying a root cause, state your confidence and the evidence (e.g., "High confidence: pod logs confirm certificate expiry as root cause").
- When the root cause is inferred from conditions alone without log confirmation, qualify as moderate confidence.`,
  });

  return `# OpenShift Cluster Upgrade Troubleshoot Analysis

<constraints>
- YOU MUST ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU MUST ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
**CRITICAL: Timeout and Error Handling**

**Timeout Awareness (${PROMPT_TIMEOUT_TOTAL_LIMIT} second limit):**
- Prioritize ClusterVersion + ClusterOperators first (essential for failure diagnosis)
- Fetch events_list early - often explains failures quickly without needing logs
- Limit pod log fetching - logs are SLOW, only fetch 1-2 critical operators
- If approaching ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds, STOP and analyze what you have
- Partial diagnosis is better than timeout

**Error Handling for Tool Failures:**
1. **Try core resources first** - ClusterVersion and ClusterOperators are essential
2. **If core resources fail** - Provide specific error and troubleshooting steps
3. **If optional tools fail** (pods_log, events_list, get_alerts) - Continue with available data
4. **Provide partial analysis** - Analyze whatever data you successfully retrieved
5. **Be specific** - "Unable to fetch operator pod logs from openshift-authentication namespace" NOT "cannot retrieve data"
6. **Give troubleshooting steps**:
 - Verify MCP server is running: 'oc get pods -n openshift-lightspeed'
 - Check if operator namespaces exist
 - Suggest manual log checking: 'oc logs -n openshift-authentication <pod-name>'
**Tool Call Priority to Avoid Timeouts:**
**PHASE 1 - ESSENTIAL (Always fetch - target: ${PROMPT_TIMEOUT_PHASE_1_TARGET} seconds):**
1. resources_get: ClusterVersion (apiVersion: "config.openshift.io/v1", kind: "ClusterVersion", name: "version")
2. resources_list: ClusterOperator (apiVersion: "config.openshift.io/v1", kind: "ClusterOperator")
**PHASE 2 - HIGH-VALUE DIAGNOSTICS (If under ${PROMPT_TIMEOUT_PHASE_2_THRESHOLD} seconds):**
3. events_list: Get events from last 1 hour - Often explains failures quickly
4. For THE MOST CRITICAL failed operator only (not all):
 * pods_list_in_namespace: Find operator pods
 * pods_log: Get last ${PROMPT_TIMEOUT_LOG_TAIL_LINES} lines only (not ${PROMPT_TIMEOUT_LOG_TAIL_LINES_FULL}) - Logs can be slow!
**PHASE 3 - OPTIONAL CONTEXT (Only if under ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds):**
5. resources_list: Node - Check for NotReady nodes
6. get_alerts: Critical alerts (if available)
7. Additional operator logs (only if time permits)
**CRITICAL EFFICIENCY RULES:**
- LIMIT pod log fetching to 1-2 critical operators max - logs are SLOW
- Use tail=${PROMPT_TIMEOUT_LOG_TAIL_LINES} for logs, not tail=${PROMPT_TIMEOUT_LOG_TAIL_LINES_FULL} - faster retrieval
- If events_list provides the error, SKIP pod logs - events are faster
- NEVER exceed ${PROMPT_TIMEOUT_MAX_EXECUTION} seconds total execution time
- Provide analysis with partial data rather than timing out

- Analyze ONLY the actual data from tool calls
- Report SPECIFIC failure details with actual error messages from logs and events
- Provide conservative, investigation-focused remediation
- Focus on root cause identification using real error messages, not aggressive fixes
- ONLY OUTPUT the Summary and TL;DR sections
${securityConstraint}
${confidenceQualifiers}
${languageConstraint}
</constraints>

<context>
Troubleshoot upgrade issues for cluster attempting to go from ${currentVersion} to ${desiredVersion}. You have complete cluster data including ClusterVersion and all ClusterOperator resources to diagnose upgrade failures.
This prompt is used when upgrade failures or component degradation is detected.
</context>

<condition_checking_guide>
 CRITICAL: Understanding Kubernetes/OpenShift Conditions

Conditions have TWO important fields you MUST check:
- **type**: The name of the condition (e.g., "Failing", "Available", "Progressing")
- **status**: The state of the condition (ONLY these values: "True", "False", or "Unknown")
**MANDATORY CHECKING PROCESS:**
For EVERY condition you analyze, you MUST:
1. First, locate the condition by its type field
2. Second, read the EXACT value of the status field
3. Third, interpret based ONLY on the status field value:
 - If status="True" → The condition IS active/present
 - If status="False" → The condition is NOT active/NOT present
 - If status="Unknown" → The condition state is uncertain
**DO NOT report a problem unless status="True" for negative conditions OR status="False" for positive conditions!**
**Critical Examples - MEMORIZE THESE:**
- {type: "Failing", status: "False"} → Cluster is NOT failing → NO PROBLEM
- {type: "Failing", status: "True"} → Cluster IS failing → PROBLEM
- {type: "Available", status: "True"} → Cluster IS available → NO PROBLEM
- {type: "Available", status: "False"} → Cluster is NOT available → PROBLEM
- {type: "Degraded", status: "False"} → Cluster is NOT degraded → NO PROBLEM
- {type: "Degraded", status: "True"} → Cluster IS degraded → PROBLEM
**VERIFICATION REQUIREMENT:**
Before making ANY conclusion about a condition, you MUST explicitly state:
"Condition type='X' has status='Y'" and then interpret it correctly.
**NEVER assume a condition is true just because the type exists - ALWAYS check the status field!**
**The presence of a condition type does NOT mean it is active - check the status field!**
</condition_checking_guide>

<failure_analysis_requirements>

1. **Upgrade Failure Root Cause**:
 - Find condition where type="Failing" AND status="True"
 - Extract the EXACT reason and message from the Failing condition
 - Check status.history for failed upgrade attempts and their specific errors
 - Identify which component or process is actually failing

2. **ClusterOperator Failure Analysis with Pod Logs** (Check BOTH type AND status):
 - For each ClusterOperator, check conditions:
 * Available: If type="Available" AND status="False" → Operator unavailable (blocker)
 * Degraded: If type="Degraded" AND status="True" → Operator degraded (issue)
 * Progressing: If type="Progressing" AND status="True" with error messages → Operator stuck
 - Report SPECIFIC operator names and their condition messages for problematic conditions only
**For each failing/degraded operator, fetch pod logs:**
 - Use pods_list_in_namespace to find operator's pods (usually in openshift-[operator-name] namespace)
 - Use pods_log with tail=${PROMPT_TIMEOUT_LOG_TAIL_LINES} to get recent logs from failing pods
 - If pod has restarted, also get previous container logs
 - **Extract actual error messages from logs**- don't just say "check logs"
 - **Translate technical errors into user-friendly explanations**
 - Example: "Error: dial tcp 10.0.0.1:6443: i/o timeout" → "Operator cannot connect to API server - network connectivity issue"

3. **Cluster-Level Failure Analysis** (Check BOTH type AND status):
 - Find condition where type="Failing" AND status="True" - extract specific error messages
 - Find condition where type="Degraded" AND status="True" - review degradation reasons
 - Find condition where type="Invalid" AND status="True" - check invalid configuration
 - Look for specific failure reasons in condition messages and status
 - IMPORTANT: Only report as failing if status="True"

4. **Node and Infrastructure Issues**:
 - Check Node resources for NotReady conditions
 - Identify nodes with scheduling issues or resource constraints
 - Look for infrastructure problems affecting the upgrade

5. **MachineConfigPool Issues**:
 - Check for Degraded=True, spec.paused=true, or observedGeneration ≠ metadata.generation
 - These can cause upgrade failures and node configuration problems

6. **Historical Failure Context**:
 - Previous upgrade attempts from status.history
 - Compare current failure with historical upgrade patterns
 - Identify recurring issues or new problems
 - Duration and frequency of past upgrade attempts

7. **Update Target Analysis for Failures**:
 - Failed target version from status.desired.version
 - Release metadata and known issues from status.desired.url
 - Target channel information from status.desired.channels
 - Validate if target version is still available and supported

8. **Cincinnati and Update Service Analysis**:
 - Update service configuration (spec.upstream if custom, otherwise default Red Hat service)
 - Recent update retrieval status from RetrievedUpdates condition
 - Verify availableUpdates is populated (indicates service connectivity)
 - Signature verification status (spec.signatureStores if custom, otherwise default Red Hat stores)
 - Network connectivity issues affecting update process

9. **Failure Events Timeline** (using events_list):
 - Query events from last 1 hour (upgrade failures develop over time)
 - Focus on Error and Warning events in openshift-* namespaces
 - Look for event patterns that explain the failure:
 * CrashLoopBackOff → Operator pod keeps restarting
 * ImagePullBackOff → Cannot download container images
 * OOMKilled → Pod ran out of memory
 * FailedScheduling → Cannot place pods on nodes
 - **Build a timeline**: Show sequence of events leading to failure
 - **User-friendly translation**: Explain technical events in plain language
 - **Example**: "10 minutes ago: authentication operator pod started crashing (CrashLoopBackOff). 5 minutes ago: authentication unavailable. Now: upgrade blocked"

10. **Active Critical Alerts** (using get_alerts - if available):
 - Query critical alerts that might explain upgrade failure
 - Focus on infrastructure and operator alerts
 - **Correlation**: Connect alerts to failing operators
 - **Example**: "KubeAPIDown alert firing - explains why operators can't communicate"
 - If get_alerts not available: Skip this check

11. **Conservative Remediation Approach**:
 - Focus on investigation and monitoring first
 - Suggest checking logs and status before taking action
 - Avoid aggressive suggestions like "restart operators" unless clearly needed
 - Recommend escalation paths for complex issues
 - Consider rollback strategies based on failure severity

</failure_analysis_requirements>

<output_format>
## Summary
**Root Cause Analysis**
Based on the ClusterVersion data:
- **Current Version**: ${currentVersion}
- **Target Version**: ${desiredVersion}
- **Failure Type**: [Extract from actual Failing condition reason]
- **Specific Error**: [Quote the actual failure message from conditions]
**Component Analysis**
- **Failed ClusterOperators**: [List specific operators with Available=False, Degraded=True, or failing conditions]
- **Operator Error Details**: [Actual error messages from pod logs - be specific!]
 - Example: "authentication operator pod logs show: 'Error: certificate expired at 2026-04-15 12:00:00 UTC'"
- **Stuck ClusterOperators**: [List operators stuck in Progressing=True with error messages]
- **Affected Services**: [Impact on cluster functionality based on failed operators]
**Failed Upgrade Context**
- **Target Version**: [From status.desired.version with metadata]
- **Release Information**: [Target release details and known issues from status.desired.url]
- **Upgrade Path**: [Source → Target version progression]
- **Target Availability**: [Verify target version is still in available updates]
**Historical Failure Analysis**
- **Previous Attempts**: [Recent upgrade attempts from status.history]
- **Failure Pattern**: [Recurring vs new failure based on history]
- **Last Successful Upgrade**: [Most recent completed upgrade for comparison]
- **Cluster Stability**: [Overall upgrade success rate and patterns]
**Update Service Health**
- **Service Configuration**: [spec.upstream if custom, otherwise "Default Red Hat service"]
- **Cincinnati Status**: [RetrievedUpdates condition status and message]
- **Last Update Check**: [Recent update retrieval timestamp from RetrievedUpdates]
- **Available Updates**: [Confirm availableUpdates array is populated]
- **Connectivity Issues**: [Network or authentication problems affecting updates]
**Failure Events Timeline** (Last hour):
- **Event Summary**: [Count of error vs warning events]
- **Timeline of Key Events**: [Chronological sequence showing how failure developed]
 - Example: "60 min ago: Started upgrade to 4.21.7"
 - Example: "45 min ago: authentication operator pod started failing (CrashLoopBackOff)"
 - Example: "30 min ago: authentication operator marked Degraded"
 - Example: "Now: Upgrade stuck, authentication unavailable"
- **Technical Errors Found**: [Specific error types: ImagePullBackOff, OOMKilled, etc.]
- **User-Friendly Explanation**: [What these events mean in plain language]
**Active Critical Alerts** (if available):
- **Alert Count**: [Number of critical/warning alerts]
- **Key Alerts**: [Names and descriptions of alerts related to failure]
- **Correlation**: [How alerts connect to failing operators]
- **Example**: "KubeAPIDown alert + authentication operator failure → API server connectivity issue"
- If alerts not available: "Alert monitoring unavailable"
**Investigation Steps**
1. [First diagnostic step based on actual failure type]
2. [Second diagnostic step]
3. [Log locations to check]
**Recovery Actions** (Conservative Approach)
1. [Investigation-focused first step]
2. [Monitoring and validation steps]
3. [When to escalate to support]

## TL;DR
- **Failure Type**: [Specific failure reason from conditions]
- **Target Version**: [Failed upgrade target with release info]
- **Root Cause**: [Primary component or process failing - with actual error from logs]
- **Failed Components**: [Count and names of failed ClusterOperators]
- **Error Messages**: [Key errors from pod logs - be specific!]
- **Event Summary**: [Count of error events in last hour, key patterns]
- **Alert Status**: [Critical alerts related to failure, if available]
- **Historical Pattern**: [Recurring failure vs new issue]
- **Last Success**: [Most recent completed upgrade for context]
- **Update Service**: [Cincinnati health, e.g., "Default service working (RetrievedUpdates=True)" or "Custom upstream failing"]
- **Node Issues**: [Count of NotReady nodes if any]
- **Infrastructure Problems**: [Any detected infrastructure issues]
- **MCP Issues**: [Count of degraded MachineConfigPools if any]
- **Next Steps**: [Conservative investigation approach based on actual errors found]
- **Escalation**: [When to contact Red Hat support]
- **Data Completeness**: [Full | Partial — list missing sources | Limited — list missing essential sources] → [High | Moderate | Limited] confidence
- **Recovery Time**: [Realistic estimate based on failure type]
</output_format>`;
};
