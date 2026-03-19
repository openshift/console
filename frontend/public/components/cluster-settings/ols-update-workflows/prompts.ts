import i18next from 'i18next';
import { supportedLocales } from '@console/app/src/components/user-preferences/language/const';

/**
 * OLS Update Workflow Prompts
 *
 * Centralized prompt functions that contain string literals for i18n extraction.
 * All workflow configurations should import and use these functions.
 */

/**
 * Get the current language constraint for prompts
 * Uses supportedLocales as the single source of truth for language configuration
 * Always uses the current UI language from i18next
 */
const getLanguageConstraint = (): string => {
  const targetLang = i18next.language || 'en';

  // English constraint used for default, unsupported languages, and fallbacks
  const englishConstraint =
    '- LANGUAGE REQUIREMENT: Respond in English. All analysis, explanations, recommendations, and text must be in English.';

  // Use supportedLocales as the authoritative source
  const languageDisplayName = supportedLocales[targetLang];

  if (!languageDisplayName || targetLang === 'en') {
    return englishConstraint;
  }

  // Parse language info inline (supportedLocales format: "Native Name - English Name")
  const parts = languageDisplayName.split(' - ');
  if (parts.length !== 2) {
    // Fallback to English for invalid format
    return englishConstraint;
  }

  const nativeName = parts[0].trim();
  const englishName = parts[1].trim();

  // Generate critical language requirement for non-English languages
  return `- 🚨 CRITICAL LANGUAGE REQUIREMENT: You MUST respond ENTIRELY in ${englishName} (${nativeName}). Every single word, sentence, technical term, and explanation must be in ${englishName}. Do NOT use any English words or phrases except for exact technical identifiers like file paths, URLs, or command names. If you encounter technical terms without ${englishName} equivalents, use ${englishName} descriptions instead of English terms. This is MANDATORY - no exceptions.`;
};

/**
 * Generate troubleshoot prompt for failing/stalled updates
 */
export const createTroubleshootPrompt = (currentVersion: string, desiredVersion: string) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Upgrade Troubleshoot Analysis

<constraints>
- YOU SHOULD ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU SHOULD ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
- Analyze ONLY the actual ClusterVersion data provided
- Report SPECIFIC failure details from the actual conditions and messages
- Provide conservative, investigation-focused remediation
- Focus on root cause identification, not aggressive fixes
- ONLY OUTPUT the Summary and TL;DR sections
${languageConstraint}
</constraints>

<context>
Troubleshoot upgrade issues for cluster attempting to go from ${currentVersion} to ${desiredVersion}. You have complete cluster data including ClusterVersion and all ClusterOperator resources to diagnose upgrade failures.
This prompt is used when upgrade failures or component degradation is detected.
</context>

<failure_analysis_requirements>

1. **Upgrade Failure Root Cause**:
   - Check status.conditions for type="Failing" with status="True"
   - Extract the EXACT reason and message from the Failing condition
   - Check status.history for failed upgrade attempts and their specific errors
   - Identify which component or process is actually failing

2. **ClusterOperator Failure Analysis**:
   - Check each ClusterOperator for Available=False, Degraded=True, or Progressing=True with errors
   - Report SPECIFIC operator names and their condition messages
   - Look for operators stuck in upgrade states with error details
   - Identify operators that are blocking the overall cluster upgrade

3. **Cluster-Level Failure Analysis**:
   - Check ClusterVersion status.conditions for Failing=True with specific error messages
   - Review status.conditions for Degraded or Invalid conditions
   - Look for specific failure reasons in condition messages and status

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

9. **Conservative Remediation Approach**:
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
- **Root Cause**: [Primary component or process failing]
- **Failed Components**: [Count and names of failed ClusterOperators]
- **Historical Pattern**: [Recurring failure vs new issue]
- **Last Success**: [Most recent completed upgrade for context]
- **Update Service**: [Cincinnati health, e.g., "Default service working (RetrievedUpdates=True)" or "Custom upstream failing"]
- **Node Issues**: [Count of NotReady nodes if any]
- **Infrastructure Problems**: [Any detected infrastructure issues]
- **MCP Issues**: [Count of degraded MachineConfigPools if any]
- **Next Steps**: [Conservative investigation approach]
- **Escalation**: [When to contact Red Hat support]
- **Recovery Time**: [Realistic estimate based on failure type]
</output_format>`;
};

interface OperatorStatusCounts {
  total: number;
  updated: number; // Current version equals target version
  updating: number; // Current version < target AND Progressing=True
  pending: number; // Current version < target AND Progressing=False
  failed: number; // Available=False OR Degraded=True
}

/**
 * Generate progress prompt for ongoing updates
 */
export const createProgressPrompt = (
  currentVersion: string,
  desiredVersion: string,
  operatorCounts: OperatorStatusCounts,
) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Upgrade Progress Monitor

<constraints>
- YOU SHOULD ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU SHOULD ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
- Monitor ONLY actual upgrade progress from ClusterVersion data
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

<progress_monitoring_requirements>

1. **Upgrade State Verification**:
   - Confirm spec.desiredUpdate.version matches ${desiredVersion}
   - Check status.conditions for type="Progressing" with specific progress details
   - Verify no Failing=True conditions are present

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

3. **Timeline and ETA Analysis**:
   - Extract upgrade start time from status.history (find the entry with state="Partial" and use its startedTime)
   - Format start time as ISO timestamp (e.g., "2026-04-02T13:41:58Z")
   - Calculate elapsed time and format as human-readable duration (e.g., "Approximately 1 hour and 20 minutes")
   - Extract progress details from Progressing condition message if available
   - Calculate progress percentage using operator counts: (${operatorCounts.updated} / ${operatorCounts.total}) * 100
   - Calculate ETA based on current progress rate and format as human-readable duration
   - Use specific format in Timeline Analysis:
     * "Upgrade started: [ISO timestamp]"
     * "Elapsed time: [Human-readable duration]"
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
- **Pending Operators**: ${operatorCounts.pending} of ${operatorCounts.total} operators waiting to start
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

**Health Indicators**
- **Issues Detected**: [Any warning signs, delays, or specific operator issues requiring attention]
- **Cluster Status**: [Overall cluster condition health based on ClusterVersion conditions]
- **Timeline Analysis**:
  * Upgrade started: [Extract startedTime from status.history, format as ISO timestamp]
  * Elapsed time: [Calculate duration from start time to current time in human-readable format]
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
- **ETA**: [Estimated time remaining based on current progress rate]
- **Action Required**: [Continue monitoring | Investigate delays | Address operator issues]
</output_format>`;
};

/**
 * Generate precheck prompt for cluster with available updates
 */
export const createPreCheckPrompt = (currentVersion: string) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Upgrade Pre-Check Analysis

<constraints>
${languageConstraint}

- YOU SHOULD ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU SHOULD ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
- YOU MUST analyze the actual ClusterVersion AND ClusterOperator data provided in the attachments
- NEVER use placeholder or dummy data - only reference real data from the attachments
- ONLY report issues that are actually present in the data
- ONLY OUTPUT the Summary and TL;DR sections
- Be specific about the source of any issues identified
- CRITICAL: When counting available updates, count ALL array elements in status.availableUpdates

<language_validation>
BEFORE providing your response, verify:
1. Every word in your response is in the target language (except system identifiers like file paths, URLs, command names)
2. Technical terms are translated or explained in the target language
3. No English phrases or mixed language content exists in your explanations
4. All section headers and content follow the target language requirements
</language_validation>
</constraints>

<context>
This is a pre-upgrade analysis for OpenShift cluster version ${currentVersion}. You have complete cluster data including ClusterVersion and all ClusterOperator resources. Focus on identifying real blockers that would prevent or disrupt cluster upgrades.
</context>

<critical_analysis_requirements>

1. **Rich Available Updates Analysis**:
   - Count EXACTLY how many items are in the status.availableUpdates array
   - Extract update metadata for each available update:
     * Version and image information
     * Available channels for each update (from channels array)
     * Errata/release links (from url field) if available
     * Identify the latest recommended update
   - Analyze current channel strategy and available channel options

2. **Cluster Upgrade Readiness Analysis**:
   - Check status.conditions for type="Upgradeable" (OPTIONAL condition)
     * If Upgradeable=False, this IS an upgrade blocker for MINOR upgrades - report the specific reason and message
     * If Upgradeable=True, missing, or Unknown - upgrades are allowed
   - Check status.conditions for type="Failing"
     * If Failing=True, this indicates cluster reconciliation issues - report details
   - Check status.conditions for type="Available"
     * If Available=False, this indicates cluster operational issues
   - Note: Upgradeable condition is optional and may not be present in all clusters

3. **ClusterOperator Health Check** (Using Official OpenShift Standards):
   - **Available=False**: Component requires immediate administrator intervention (upgrade blocker)
   - **Degraded=True**: Component doesn't match desired state, may have lower quality of service
   - **Progressing=True with errors**: Component stuck rolling out changes (potential blocker)
   - **Upgradeable=False**: Component explicitly blocks minor upgrades until resolved
   - Report specific operator names and their condition messages
   - Focus on Available=False and Upgradeable=False as primary upgrade blockers

4. **User Workload PDB Analysis** (IMPORTANT - Filter System PDBs):
   - Query PodDisruptionBudgets in ALL namespaces EXCEPT these OpenShift system namespaces:
     * openshift-* (all openshift- prefixed namespaces)
     * kube-* (all kube- prefixed namespaces)
     * default, openshift
   - ONLY flag user workload PDBs where:
     * minAvailable >= 1 AND it covers critical user applications
     * maxUnavailable = 0 AND it covers critical user applications
   - IGNORE all PDBs in OpenShift system namespaces - these are managed by Red Hat
   - If no problematic user workload PDBs exist, state "No problematic user workload PDBs found"

5. **MachineConfigPool Status**:
   - Check for Degraded=True, spec.paused=true, or observedGeneration ≠ metadata.generation
   - These indicate node configuration issues that block upgrades
   - Focus on master and worker MCPs which are critical for upgrade success

6. **Node and Infrastructure Issues**:
   - Check Node resources for NotReady conditions
   - Identify nodes with scheduling issues or resource constraints
   - Look for infrastructure problems affecting the upgrade

7. **Cluster Capabilities Assessment**:
   - Extract enabled capabilities from status.capabilities.enabledCapabilities
   - Extract known capabilities from status.capabilities.knownCapabilities
   - Identify disabled capabilities (known but not enabled)
   - Assess capability health impact on upgrades
   - Check spec.capabilities.baselineCapabilitySet and additionalEnabledCapabilities

8. **Update Channel Strategy Analysis**:
   - Current channel from spec.channel
   - Available channels for current version from status.desired.channels
   - Channel recommendations based on version and use case
   - EUS (Extended Update Support) upgrade path options if applicable

9. **Cincinnati Update Service Health**:
   - Check spec.upstream (if configured) or note "using default Red Hat update service"
   - Verify status.conditions for type="RetrievedUpdates" status and timestamp
   - Confirm status.availableUpdates is populated (indicates working service)
   - Cluster ID for telemetry (spec.clusterID)
   - Signature verification status (spec.signatureStores if present, otherwise default stores)

10. **Cluster Version History Context**:
   - Extract initial cluster version from status.history (first entry)
   - Identify upgrade path from history entries
   - Last completed upgrade and timeframe
   - Any partial or failed upgrade attempts
   - Total cluster age and upgrade frequency

11. **Configuration Overrides Analysis**:
   - Review spec.overrides for any unmanaged components that might block upgrades
   - Distinguish between supported capabilities exclusion vs unsupported overrides
   - Check for configuration settings that could impact upgrade processes

</critical_analysis_requirements>

<output_format>
## Summary

**Available Updates Analysis**
- **Update Count**: [Total count of ALL items in status.availableUpdates array]
- **Available Versions**: [List of available versions with channels, e.g., "4.21.4 (stable-4.21, fast-4.21)", "4.22.0 (candidate-4.22)"]
- **Latest Update**: [Most recent version with errata link if available, e.g., "4.21.4 - https://access.redhat.com/errata/RHSA-2026:2984"]
- **Channel Recommendations**: [Current channel and suggested options based on release readiness]

**Cluster Capabilities Configuration**
- **Enabled Capabilities**: [List from status.capabilities.enabledCapabilities, e.g., "Console, marketplace, openshift-samples"]
- **Disabled Capabilities**: [Known capabilities not enabled, e.g., "baremetal, insights"]
- **Capability Set**: [From spec.capabilities.baselineCapabilitySet, e.g., "vCurrent"]
- **Capability Health**: [Any capability-related issues affecting upgrades]

**Update Service Health**
- **Cincinnati Service**: [spec.upstream URL if configured, otherwise "Default Red Hat update service"]
- **Service Status**: [RetrievedUpdates condition status and message]
- **Last Update Check**: [From RetrievedUpdates condition lastTransitionTime]
- **Update Channel**: [Current spec.channel, e.g., "stable-4.21"]
- **Cluster ID**: [spec.clusterID for telemetry]

**Cluster History Context**
- **Initial Version**: [First entry from status.history, e.g., "4.20.0 (installed Jan 2026)"]
- **Upgrade Path**: [Recent version progression from history]
- **Last Completed Upgrade**: [Most recent completed entry with timeframe]
- **Cluster Age**: [Time since initial installation]

**Upgrade Readiness Assessment**
- Whether upgrades are currently blocked (check Upgradeable=False if present, Failing=True, or degraded operators)
- Any problematic USER WORKLOAD PDBs (not OpenShift system PDBs)
- Unhealthy operators that would impact upgrades
- MCP issues that would prevent node updates
- Configuration overrides vs supported capability exclusions

If no critical issues are found, clearly state the cluster appears ready for upgrade.

## TL;DR
- **Current Version**: ${currentVersion}
- **Available Updates**: [TOTAL count, e.g., "6 updates available"]
- **Latest Update**: [Version with channels, e.g., "4.21.4 (stable-4.21, fast-4.21)"]
- **Update Channel**: [Current channel, e.g., "stable-4.21"]
- **Channel Options**: [Available channels for current version]
- **Capabilities**: [Count enabled/disabled, e.g., "5 enabled, 2 disabled (baremetal, insights)"]
- **Initial Version**: [From history, e.g., "4.20.0 (Jan 2026)"]
- **Last Upgrade**: [Most recent completed upgrade with date]
- **Cincinnati Health**: [Update service status, e.g., "Default service healthy (RetrievedUpdates=True, 6 hours ago)" or "Custom upstream: URL (status)"]
- **Upgrade Blocked**: [Yes/No - based on Upgradeable=False if present, Failing=True, or operator health]
- **Upgrade Blockers**: [specific reason from Upgradeable=False message, or Failing condition, or degraded operators]
- **Unhealthy ClusterOperators**: [count and names if any]
- **User Workload PDBs**: [count of problematic NON-OpenShift PDBs]
- **Degraded MCPs**: [count and names if any]
- **Node Issues**: [count of NotReady nodes if any]
- **Configuration Issues**: [any problematic overrides or settings]
- **Recommendation**: [Proceed with upgrade | Address specific issues first | Consider channel change]
</output_format>`;
};

/**
 * Generate precheck prompt for specific target version
 */
export const createPreCheckSpecificVersionPrompt = (
  currentVersion: string,
  targetVersion: string,
) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Upgrade Pre-Check Analysis

<constraints>
- YOU SHOULD ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU SHOULD ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
- Analyze ONLY the actual ClusterVersion data provided in the attachments
- Report SPECIFIC details from the actual conditions and messages
- ONLY OUTPUT the Summary and TL;DR sections
- Be specific about the source of any information identified
- CRITICAL: When counting available updates, count ALL array elements in status.availableUpdates
${languageConstraint}
</constraints>

<context>
This is a pre-upgrade analysis for OpenShift cluster upgrade from ${currentVersion} to ${targetVersion}. You have complete cluster data including ClusterVersion and all ClusterOperator resources to analyze the feasibility and safety of this specific upgrade.
</context>

<critical_analysis_requirements>

1. **Target Version Verification** (PRIORITY):
   - Look in status.availableUpdates array for ${targetVersion}
   - If found, extract its channels, url, and image information
   - If NOT found, report "${targetVersion} is not available for upgrade"

2. **Cluster Upgrade Readiness**:
   - Check status.conditions for type="Upgradeable" (may not exist)
     * If Upgradeable=False, report the specific reason - this blocks upgrades
   - Check status.conditions for type="Failing"
     * If Failing=True, report details - this indicates problems
   - Check status.conditions for type="Available"
     * If Available=False, report cluster operational issues

3. **ClusterOperator Health Check**:
   - Check ClusterOperator resources for Available=False, Degraded=True, or Upgradeable=False
   - Report specific operator names and their issues
   - Focus on operators that would block upgrades

4. **Current Cluster Configuration**:
   - Extract spec.channel (current update channel)
   - Extract spec.clusterID
   - Check if spec.upstream is configured (custom Cincinnati server)
   - Note status.conditions RetrievedUpdates condition

5. **User Workload PDB Analysis**:
   - Check PodDisruptionBudgets in user namespaces (NOT openshift-* or kube-*)
   - Flag problematic PDBs with restrictive settings
   - If no issues, state "No problematic user workload PDBs found"

6. **Infrastructure Readiness**:
   - Check MachineConfigPool status for Degraded=True or paused pools
   - Check Node resources for NotReady conditions
   - Look for infrastructure problems

</critical_analysis_requirements>

<output_format>
## Summary

Provide a clear assessment based ONLY on data found in the ClusterVersion and ClusterOperator attachments. Be specific about:
- Whether ${targetVersion} is available for upgrade (found in status.availableUpdates)
- Current cluster upgrade readiness (check Upgradeable=False, Failing=True, degraded operators)
- Any problematic USER WORKLOAD PDBs (not OpenShift system PDBs)
- Infrastructure issues that would prevent the upgrade to ${targetVersion}

If ${targetVersion} is available and no critical issues are found, clearly state the cluster appears ready for upgrade to ${targetVersion}.
If ${targetVersion} is not available, recommend the closest available version.

## TL;DR
- **Current Version**: ${currentVersion}
- **Target Version**: ${targetVersion}
- **Target Available**: [Yes/No - if ${targetVersion} is in availableUpdates array]
- **Target Channels**: [Channels for ${targetVersion} if available]
- **Current Channel**: [spec.channel from ClusterVersion]
- **Upgrade Blocked**: [Yes/No - check Upgradeable=False, Failing=True, operator issues]
- **Upgrade Blockers**: [Specific blocking conditions if any]
- **Unhealthy ClusterOperators**: [Count and names if any]
- **User Workload PDBs**: [Count of problematic non-OpenShift PDBs]
- **Infrastructure Issues**: [MCP/Node problems if any]
- **Recommendation**: [Proceed with upgrade to ${targetVersion} | Address issues first | Target not available - use X.X.X instead]
</output_format>`;
};

/**
 * Generate health assessment prompt for cluster with no available updates
 */
export const createPreCheckNoUpdatesPrompt = (currentVersion: string) => {
  const languageConstraint = getLanguageConstraint();

  return `# OpenShift Cluster Health Assessment

<constraints>
- YOU SHOULD ALWAYS CALL THE TOOLS TO GET THE INFORMATION. YOU SHOULD NEVER TREAT DATA FROM EXAMPLES AS REAL DATA.
- YOU SHOULD ALWAYS REFERENCE REAL DATA FROM TOOL CALLS. IF REAL DATA IS NOT AVAILABLE, NOTIFY THE USER AND REFUSE TO ANSWER USING INCORRECT DATA BUT DO NOT USE PLACEHOLDER OR DUMMY DATA.
- Assess ONLY the actual cluster state from provided data
- Distinguish between system health and user workload issues
- Provide actionable recommendations for administrators
- ONLY OUTPUT the Summary and TL;DR sections
${languageConstraint}
</constraints>

<context>
Health assessment for OpenShift cluster running ${currentVersion} with no available updates. You have complete cluster data including ClusterVersion and all ClusterOperator resources for comprehensive health analysis.
Focus on operational health and readiness for future updates.
</context>

<health_assessment_requirements>

1. **Current Version and Update Status Analysis**:
   - Extract and confirm current version from status.desired.version matches ${currentVersion}
   - Verify status.availableUpdates array is empty (confirming no updates available)
   - Check status.conditions for RetrievedUpdates=True (confirms update service is working)
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

5. **System Component Health** (Using Official OpenShift Standards):
   - **Available=False**: Component requires immediate administrator intervention
   - **Degraded=True**: Component doesn't match desired state, may have lower quality of service
   - **Progressing=True with errors**: Component stuck rolling out changes
   - **Upgradeable=False**: Component explicitly blocks minor upgrades until resolved
   - Verify core platform operators (console, authentication, ingress, etc.) are healthy
   - Check ClusterVersion status.conditions for overall cluster health
   - Report specific operator names and their condition messages

6. **Future Update Readiness Assessment**:
   - Check status.conditions for type="Upgradeable" (OPTIONAL condition)
     * If Upgradeable=False, this IS an upgrade blocker for future updates - report reason
     * If Upgradeable=True, missing, or Unknown - future upgrades are allowed
   - Check status.conditions for type="Failing"
     * If Failing=True, this indicates cluster issues that must be resolved
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
