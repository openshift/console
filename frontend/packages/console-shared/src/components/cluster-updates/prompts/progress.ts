import {
  PROMPT_TIMEOUT_TOTAL_LIMIT,
  PROMPT_TIMEOUT_WARNING_THRESHOLD,
  PROMPT_TIMEOUT_MAX_EXECUTION,
} from './shared/constants';
import { getLanguageConstraint } from './shared/language-utils';

export interface OperatorStatusCounts {
  total: number;
  updated: number;
  updating: number;
  pending: number;
  failed: number;
}
export const createProgressPrompt = (
  currentVersion: string,
  desiredVersion: string,
  operatorCounts: OperatorStatusCounts,
) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Upgrade Progress Monitor

<constraints>
- YOU MUST ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU MUST ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
**CRITICAL: Timeout and Error Handling**

**Timeout Awareness (${PROMPT_TIMEOUT_TOTAL_LIMIT} second limit):**
- Progress monitoring needs to be FAST - users expect quick updates
- ClusterVersion + ClusterOperators gives you operator progress (X of Y) - sufficient for basic progress
- Events and other data add context but aren't required
- Target: Complete analysis in under 40 seconds for responsive UX
- If approaching ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds, provide progress summary immediately
**Error Handling for Tool Failures:**
1. **Core data is essential**- ClusterVersion and ClusterOperators are required for progress tracking
2. **If core resources fail** - Explain specifically what failed and provide troubleshooting
3. **Optional data can be skipped**- nodes_top, events_list, get_alerts are nice-to-have
4. **Provide progress with available data**- Even without events, you can show operator progress
5. **Never give up**- Always show some progress information, even if incomplete
**Tool Call Priority to Avoid Timeouts:**
**PHASE 1 - ESSENTIAL (Always fetch - target: 25 seconds):**
1. resources_get: ClusterVersion (apiVersion: "config.openshift.io/v1", kind: "ClusterVersion", name: "version")
2. resources_list: ClusterOperator (apiVersion: "config.openshift.io/v1", kind: "ClusterOperator")
**PHASE 2 - HELPFUL CONTEXT (Only if under 45 seconds):**
3. events_list: Get recent events (last 30 minutes) - Quick way to spot warnings
4. resources_list: MachineConfigPool - Shows node update progress
**PHASE 3 - NICE-TO-HAVE (Only if under ${PROMPT_TIMEOUT_WARNING_THRESHOLD} seconds):**
5. nodes_top: Monitor node resource usage during upgrade
6. get_alerts: Check for warning alerts (if available)
**CRITICAL EFFICIENCY RULES:**
- Progress monitoring is time-sensitive - provide fast updates
- ClusterVersion + ClusterOperators is sufficient for basic progress (X of Y operators)
- Events and MCPs add context but aren't required
- NEVER exceed ${PROMPT_TIMEOUT_MAX_EXECUTION} seconds - better to show quick progress than timeout
- Users can refresh for updated progress - speed > completeness

- Monitor ONLY actual upgrade progress from tool call data
- Report specific progress indicators and timelines using EXACT operator counts from the data
- Use the format "X of Y operators" consistently throughout the output
- Calculate precise percentages: (${operatorCounts.updated} / ${operatorCounts.total}) * 100
- Format durations in human-readable terms (e.g., "Approximately 1 hour and 20 minutes")
- Use specific operator counts in all sections, not generic descriptions
- Identify potential issues early with conservative recommendations
- ONLY OUTPUT the Summary and TL;DR sections exactly as specified in the output format
${languageConstraint}
</constraints>

<context>
Monitor upgrade progress from ${currentVersion} to ${desiredVersion}. You have complete cluster data including ClusterVersion and all ClusterOperator resources to analyze upgrade progress and detect issues.
Focus on detecting issues early while avoiding false alarms.
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
- {type: "Progressing", status: "True"} means the cluster IS progressing (upgrading)
- {type: "Progressing", status: "False"} means the cluster is NOT progressing (stable)
- {type: "Failing", status: "False"} means the cluster is NOT failing (healthy)
- {type: "Failing", status: "True"} means the cluster IS failing (problem)
**NEVER assume a condition is true just because the type exists - ALWAYS check the status field!**
</condition_checking_guide>

<progress_monitoring_requirements>

1. **Upgrade State Verification** (Check BOTH type AND status):
 - Confirm spec.desiredUpdate.version matches ${desiredVersion}
 - Find condition where type="Progressing" AND status="True" - extract progress details
 - Verify no conditions where type="Failing" AND status="True" are present

2. **Component Progress Tracking** (CRITICAL - Use Provided Operator Counts):
 - You are provided with pre-calculated operator counts: ${operatorCounts.total} total, ${operatorCounts.updated} updated, ${operatorCounts.updating} updating, ${operatorCounts.pending} pending, ${operatorCounts.failed} failed
 - ALWAYS use the "X of Y operators" format consistently:
 * "**Updated Operators**: ${operatorCounts.updated} of ${operatorCounts.total} operators at target version ${desiredVersion}"
 * "**Updating Operators**: ${operatorCounts.updating} of ${operatorCounts.total} operators progressing toward target"
 * "**Pending Operators**: ${operatorCounts.pending} of ${operatorCounts.total} operators waiting to start"
 * "**Failed Operators**: ${operatorCounts.failed} of ${operatorCounts.total} operators with issues"
 - Calculate upgrade completion percentage using the exact formula: (${operatorCounts.updated} / ${operatorCounts.total}) * 100
 - In TL;DR section, use format: "${operatorCounts.updated} of ${operatorCounts.total} operators at target version ([X% complete])"
 - For pending components, combine counts: "${operatorCounts.updating} updating + ${operatorCounts.pending} pending operators"
 - NEVER use vague terms like "several" or "most" - always use exact counts provided

3. **Timeline and ETA Analysis - CRITICAL INSTRUCTIONS**:
**FINDING THE CORRECT START TIME:**
 - Look in status.history array - it's ordered with MOST RECENT first (index 0)
 - The CURRENT upgrade is the FIRST entry where state="Partial" (in-progress upgrade)
 - Use the startedTime field from that Partial entry ONLY
 - Example: If history[0].state="Partial" and history[0].startedTime="2026-05-04T16:59:26Z", use "2026-05-04T16:59:26Z"
 - DO NOT use startedTime from older entries with state="Completed" - those are PREVIOUS upgrades!
**FORMATTING AND CALCULATIONS:**
 - Format the startedTime as human-readable (e.g., "May 4, 2026, 4:59:26 PM UTC")
 - Calculate elapsed time from startedTime to current time
 - Format elapsed time as human-readable duration (e.g., "Approximately 1 hour and 20 minutes")
 - Extract progress details from Progressing condition message if available
 - Calculate progress percentage: (${operatorCounts.updated} / ${operatorCounts.total}) * 100
 - Calculate ETA based on current progress rate
**OUTPUT FORMAT:**
 * "Upgrade started: [human-readable start time from the Partial entry]"
 * "Elapsed time: [Human-readable duration since startedTime]"
 * "Current progress: [X% complete]"
 * "Estimated completion: [Time remaining]"
 * "Progress rate: [On track | Ahead of schedule | Behind schedule]"

4. **Upgrade Target Analysis**:
 - Current upgrade target from status.desired.version
 - Target release metadata from status.desired (url, channels)
 - Upgrade path validation from current to target version
 - Any upgrade risks or compatibility notes

5. **Cluster History Context During Upgrade**:
 - Previous completed upgrade and duration for comparison
 - Upgrade frequency pattern analysis
 - Any historical upgrade failures or issues
 - Progress comparison with typical upgrade patterns

6. **Early Issue Detection**:
 - Look for warning signs in status.conditions
 - Check for stalled progress indicators in cluster conditions
 - Report specific issues using exact operator counts: "${operatorCounts.failed} operators with issues"
 - If no issues: "No problems requiring immediate attention"
 - Use format in TL;DR: "**Issues**: [${operatorCounts.failed} operators with issues if any, otherwise "No problems requiring immediate attention"]"
 - Monitor for unexpected delays compared to historical patterns and report as "On track", "Delayed", or "Issues detected"

</progress_monitoring_requirements>

<output_format>
## Summary
**Upgrade Status**
- **Current Phase**: [Extract from Progressing condition message, e.g., "Progressing (Working towards 4.21.7: X of Y done (Z% complete))"]
- **Elapsed Time**: [Human-readable duration from upgrade start to current time]
- **Progress Indicators**: [Specific progress details and any operators currently updating]
**Component Status** (Total: ${operatorCounts.total} ClusterOperators)
- **Updated Operators**: ${operatorCounts.updated} of ${operatorCounts.total} operators at target version ${desiredVersion}
- **Updating Operators**: ${operatorCounts.updating} of ${operatorCounts.total} operators progressing toward target
- **⏸ Pending Operators**: ${operatorCounts.pending} of ${operatorCounts.total} operators waiting to start
- **Failed Operators**: ${operatorCounts.failed} of ${operatorCounts.total} operators with issues
**Upgrade Target Details**
- **Target Version**: [${desiredVersion} from status.desired.version]
- **Target Release Info**: [Errata URL from status.desired.url if available, format as markdown link]
- **Target Channels**: [List available channels from status.desired.channels, comma-separated]
- **Upgrade Path**: Current version [${currentVersion}] → Target version [${desiredVersion}]
**Historical Context**
- **Previous Upgrade**: [Most recent completed upgrade version and completion timestamp from status.history]
- **Upgrade Pattern**: [Upgrade frequency analysis and historical success pattern]
- **Duration Comparison**: [Current upgrade timeline compared to previous upgrade durations and typical patterns]
**Infrastructure Health During Upgrade**
- **MachineConfigPool Progress**: [Status of MCPs - are they updating, stuck, or complete?]
- **Node Resource Pressure**: [From nodes_top - any nodes with high CPU/memory usage?]
 - Example: "All nodes healthy - CPU usage 45-60%, memory usage 55-70%"
 - Example: " Warning: master-0 at 92% memory - monitor for slowdowns"
**Recent Progress Events** (Last 30 minutes):
- **Event Summary**: [Count of events related to upgrade progress]
- **Warning Signs**: [Any warning events that might slow progress]
 - Example: "ImagePullBackOff in 3 operators - image download issues may slow upgrade"
 - Example: "No concerning events - upgrade progressing normally"
- **Positive Indicators**: [Events showing healthy progress]
 - Example: "12 operators successfully updated to target version"
**Health Indicators**
- **Issues Detected**: [Any warning signs, delays, or specific operator issues requiring attention]
- **Cluster Status**: [Overall cluster condition health based on ClusterVersion conditions]
- **Active Alerts**: [Warning/critical alerts during upgrade, if available]
- **Timeline Analysis**:
 * Upgrade started: [Find the FIRST entry in status.history where state="Partial" - this is the CURRENT upgrade. Use ONLY its startedTime field. Convert from ISO timestamp (e.g., "2026-05-04T16:59:26Z") to human-readable (e.g., "May 4, 2026, 4:59:26 PM UTC"). DO NOT use startedTime from Completed entries!]
 * Elapsed time: [Calculate duration from the Partial entry's startedTime to current time in human-readable format]
 * Current progress: [X% complete based on operator completion ratio]
 * Estimated completion: [Time remaining calculation based on progress rate]
 * Progress rate: [Assessment: "On track", "Ahead of schedule", or "Behind schedule" compared to typical upgrade window]

## TL;DR
- **Progress**: [X% complete - (${operatorCounts.updated} Updated Operators / ${operatorCounts.total} Total Operators) * 100]
- **Target Version**: [${desiredVersion} with release info if available]
- **Target Channels**: [Available channels for target release]
- **Upgrade Duration**: [Elapsed time from upgrade start]
- **Status**: [On track | Delayed | Issues detected]
- **Updated Components**: ${operatorCounts.updated} of ${operatorCounts.total} operators at target version ([X% complete])
- **Pending Components**: ${operatorCounts.updating} updating + ${operatorCounts.pending} pending operators
- **Historical Comparison**: [How current upgrade compares to previous ones]
- **Issues**: [${operatorCounts.failed} operators with issues if any, otherwise "No problems requiring immediate attention"]
- **Resource Pressure**: [Node CPU/memory status - any nodes >90% usage?]
- **MCP Status**: [MachineConfigPool progress - all updating normally?]
- **Recent Events**: [Count of warning events in last 30 min, user-friendly summary]
- **Alerts**: [Warning/critical alerts during upgrade, if available]
- **ETA**: [Estimated time remaining based on current progress rate]
- **Action Required**: [Continue monitoring | Investigate delays | Address operator issues]
</output_format>`;
};

/**
 * Generate precheck prompt for cluster with available updates
 */
