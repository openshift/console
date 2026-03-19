# OLS Update Workflows

This directory contains the OLS (OpenShift Lightspeed) integration for cluster update workflows in the OpenShift Console.

## Overview

The OLS update workflows provide context-aware AI assistance for cluster updates by intelligently determining which prompt to show based on the cluster's current state.

## Architecture

### Two-Phase System

1. **status** phase: Active monitoring and troubleshooting
   - Shows "Update status" button
   - Used when cluster has issues or upgrade in progress
   - Automatically chooses between progress monitoring and troubleshooting

2. **pre-check** phase: Pre-update readiness assessment
   - Shows "Pre-check with AI" button
   - Used when cluster is healthy
   - Helps assess readiness before initiating updates

## Cluster State Matrix

The system handles 11 primary cluster states by examining ClusterVersion conditions, ClusterOperator health, and update availability.

### Quick Reference

| State | Conditions | Button | Prompt |
|-------|-----------|--------|--------|
| **Upgrade In Progress** | Progressing=True, no failures | Update status | Progress |
| **Upgrade Failing** | Failing=True, Progressing=True | Update status | Troubleshoot |
| **Upgrade Stalled** | Progressing=True, operator issues | Update status | Troubleshoot |
| **Cluster Failing** | Failing=True, Progressing=False | Update status | Troubleshoot |
| **Operator Issues** | Progressing=False, operator issues | Update status | Troubleshoot |
| **Service Issues** | RetrievedUpdates=False or ReleaseAccepted=False | Update status | Troubleshoot |
| **Ready for Update** | All healthy, updates available | Pre-check | Pre-check |
| **Conditional Updates** | All healthy, only conditionalUpdates | Pre-check | Pre-check |
| **No Updates** | All healthy, no updates | Pre-check | No updates |
| **Specific Version** | All healthy, version selected | Pre-check | Specific version |
| **Invalid** | Invalid=True | Update status | Troubleshoot |


## Prompt Functions

Located in `prompts.ts`:

### 1. `createProgressPrompt(currentVersion, desiredVersion, operatorCounts)`

**When used**: Upgrade in progress, no failures detected

**What it does**:
- Monitors upgrade progress (X of Y operators updated)
- Calculates completion percentage and ETA
- Tracks operator status (updated, updating, pending, failed)
- Checks MachineConfigPool progress
- Monitors resource usage and events
- Detects early warning signs

**User Intent**: Monitor progress, estimate completion time

### 2. `createTroubleshootPrompt(currentVersion, desiredVersion)`

**When used**: Any failure detected (cluster-level or operator-level)

**What it does**:
- Root cause analysis from ClusterVersion Failing condition
- Identifies failed ClusterOperators with specific errors
- Extracts error messages from pod logs
- Builds timeline of events leading to failure
- Checks update service connectivity
- Provides conservative remediation steps

**User Intent**: Diagnose failure, find root cause, get remediation

### 3. `createPreCheckPrompt(currentVersion)`

**When used**: Cluster healthy, updates available

**What it does**:
- Lists all available updates with channels and metadata
- Assesses cluster upgrade readiness
- Checks all ClusterOperator health
- Verifies MachineConfigPool status
- Identifies problematic user workload PodDisruptionBudgets
- Analyzes node health and resource pressure
- Reviews recent events and active alerts
- Checks Cincinnati service health
- Final recommendation: Ready / Address warnings / Blocked

**User Intent**: Verify readiness, understand available updates

### 4. `createPreCheckSpecificVersionPrompt(currentVersion, targetVersion)`

**When used**: User has selected a specific target version

**What it does**:
- Verifies target version is in availableUpdates
- Extracts version-specific metadata (channels, release URL)
- Checks for version-specific known issues
- Validates upgrade path is supported
- Assesses cluster readiness for that specific version

**User Intent**: Verify specific version compatibility

### 5. `createPreCheckNoUpdatesPrompt(currentVersion)`

**When used**: No updates available (cluster fully updated)

**What it does**:
- Confirms cluster is running current version
- Verifies update service connectivity (RetrievedUpdates=True)
- Assesses overall cluster health
- Reviews cluster history
- Checks for operational issues
- Confirms ready for future updates

**User Intent**: Verify health, confirm up-to-date status

## Decision Logic

### Phase Determination

The `determineWorkflowPhase()` function in `workflow-utils.ts` chooses between status and pre-check:

```typescript
// Show status button if ANY of these are true:
- Failing=True (cluster failing)
- Invalid=True (invalid configuration)
- Progressing=True (upgrade in progress)
- RetrievedUpdates=False with message (update service issue)
- ReleaseAccepted=False with message (signature verification issue)
- Any operator has Available=False (operator unavailable)
- Any operator has Degraded=True (operator degraded)

// Otherwise show pre-check button
```

### Prompt Selection within Status Phase

The status workflow (`workflow-configs.ts`) chooses between progress and troubleshoot:

```typescript
// Use troubleshoot prompt if ANY of these are true:
- Failing=True
- Invalid=True
- RetrievedUpdates=False with message
- ReleaseAccepted=False with message
- Any operator has Available=False OR Degraded=True

// Otherwise use progress prompt (healthy upgrade in progress)
```

### Prompt Selection within Pre-Check Phase

The pre-check workflow chooses the appropriate assessment:

```typescript
if (no available updates) {
  return createPreCheckNoUpdatesPrompt();
} else if (specific version selected) {
  return createPreCheckSpecificVersionPrompt();
} else {
  return createPreCheckPrompt();
}
```

## Critical Principles

### 1. Always Check the `status` Field

Conditions have TWO fields: `type` and `status`. You must check both!

```typescript
// ❌ WRONG: Just checking the type
const failing = conditions.find(c => c.type === 'Failing');

// ✅ CORRECT: Check both type AND status
const failing = conditions.find(c => c.type === 'Failing' && c.status === 'True');
```

**Examples**:
- `{type: "Failing", status: "False"}` → Cluster is NOT failing (healthy)
- `{type: "Failing", status: "True"}` → Cluster IS failing (problem)
- `{type: "Available", status: "True"}` → Cluster IS available (healthy)
- `{type: "Available", status: "False"}` → Cluster is NOT available (problem)

### 2. Failures Take Precedence

Even if `Progressing=True`, we use troubleshoot prompt if failures detected.

```typescript
// Upgrade is progressing BUT has failures → Troubleshoot, not Progress
if (Progressing=True AND (Failing=True OR operator issues)) {
  return createTroubleshootPrompt();
}
```

### 3. Operator Counts for Progress

When showing progress, we provide accurate operator counts:

```typescript
const operatorCounts = {
  total: 28,           // Total operators
  updated: 18,         // Operators at target version
  updating: 7,         // Operators progressing toward target
  pending: 3,          // Operators waiting to start
  failed: 0,           // Operators with issues
};
```

## Testing

### Running Tests

```bash
cd frontend
yarn test ols-update-workflows
```

### Test Coverage

- **cluster-state-matrix.spec.ts**: Complete state matrix (11 states + edge cases)
- **workflow-comprehensive.spec.ts**: Button logic and prompt content validation
- **workflow-utils.spec.ts**: Utility function tests
- **explain-button.spec.tsx**: React component tests

### Adding New Tests

When adding new cluster states or modifying behavior:

1. Add test case to `cluster-state-matrix.spec.ts` with clear description
2. Validate button appearance
3. Validate prompt content
4. Document expected behavior in test description

## Common Issues

### "Pre-check button shows when cluster is failing"

Check that you're examining the `status` field:
```typescript
// {type: "Failing", status: "False"} means NOT failing
const failing = condition.status === 'True'; // Not just checking if condition exists
```

### "Upgrade progress shows troubleshoot prompt"

Check for operator issues:
```typescript
// Even if Progressing=True, operator issues trigger troubleshoot
const hasOperatorIssues = operators.some(op =>
  op.status.conditions.find(c =>
    (c.type === 'Available' && c.status === 'False') ||
    (c.type === 'Degraded' && c.status === 'True')
  )
);
```

### "No button appears"

Verify cluster has conditions:
```typescript
// Missing conditions defaults to pre-check
const conditions = cv.status?.conditions || [];
```

## Conditional Updates

Conditional updates are updates that have associated conditions/risks. The structure is:

```typescript
type ConditionalUpdate = {
  release: { version: string; image: string };
  conditions: K8sResourceCondition[];
};
```

The conditions typically have:
- `type: "Recommended"`
- `status: "False"` (indicating NOT recommended due to risks)
- `message`: Contains the risk description and documentation URL

**Current Behavior**: When `availableUpdates` is empty but `conditionalUpdates` exists, the system uses the "no updates" prompt. This could be enhanced to parse the conditions and explain the risks to users.

**Example**:
```json
{
  "release": { "version": "4.16.0", "image": "..." },
  "conditions": [{
    "type": "Recommended",
    "status": "False",
    "reason": "KnownIssue",
    "message": "Clusters using OVN may experience network disruption. See https://access.redhat.com/solutions/7001234"
  }]
}
```

## Cluster State Detection API

The `cluster-state-detector.ts` module provides a comprehensive, high-level API for detecting and categorizing cluster states.

### Core Functions

#### `detectClusterState(cv, operators?): ClusterStateInfo`

Detects the current cluster state based on conditions and returns detailed information:

```typescript
const stateInfo = detectClusterState(clusterVersion, clusterOperators);

// Returns:
{
  state: ClusterState.UPDATE_IN_PROGRESS,
  description: "Cluster update is in progress",
  conditions: {
    failing: false,
    progressing: true,
    hasRecommendedUpdates: true,
    // ... all condition flags
  },
  recommendedWorkflow: "status"
}
```

#### `isClusterHealthy(cv, operators?): boolean`

Determines if cluster is in a healthy state (no failures, no operator issues).

#### `shouldShowPreCheck(cv, operators?): boolean`

Determines if pre-check workflow button should be shown.

#### `shouldShowStatus(cv, operators?): boolean`

Determines if status workflow button should be shown.

### Predicates API

The `predicates.ts` module exports comprehensive predicate functions for checking specific cluster and operator conditions. These predicates are the building blocks for cluster state detection.

#### ClusterVersion Predicates

- `isClusterFailing(cv)` - Check if Failing=True
- `isClusterInvalid(cv)` - Check if Invalid=True
- `isClusterProgressing(cv)` - Check if Progressing=True
- `isClusterAvailable(cv)` - Check if Available=True
- `isClusterUpgradeable(cv)` - Check if Upgradeable=True or not present
- `hasUpdateRetrievalFailure(cv)` - Check if RetrievedUpdates=False
- `hasReleaseAcceptanceFailure(cv)` - Check if ReleaseAccepted=False
- `hasRecommendedUpdates(cv)` - Check if availableUpdates present
- `hasConditionalUpdates(cv)` - Check if conditionalUpdates present
- `hasAnyUpdates(cv)` - Check if any updates available
- `hasUnknownConditions(cv)` - Check for Unknown condition status
- `isClusterReadyToUpdate(cv, ops?)` - Comprehensive readiness check
- `hasBlockingConditions(cv, ops?)` - Check for any blocking conditions

#### ClusterOperator Predicates

- `isOperatorDegraded(op)` - Check if operator has Degraded=True
- `isOperatorUnavailable(op)` - Check if operator has Available=False
- `isOperatorUpgradeable(op)` - Check if operator has Upgradeable=True
- `hasOperatorIssues(op)` - Check if operator is degraded or unavailable
- `hasAnyOperatorIssues(ops)` - Check if any operator has issues
- `getOperatorsWithIssues(ops)` - Get array of operators with issues

### Constants API

The `constants.ts` module exports all condition type and status constants:

```typescript
// ClusterVersion condition types
CLUSTER_VERSION_CONDITION_AVAILABLE
CLUSTER_VERSION_CONDITION_FAILING
CLUSTER_VERSION_CONDITION_PROGRESSING
CLUSTER_VERSION_CONDITION_RETRIEVED_UPDATES
CLUSTER_VERSION_CONDITION_RELEASE_ACCEPTED
CLUSTER_VERSION_CONDITION_INVALID
CLUSTER_VERSION_CONDITION_UPGRADEABLE

// ClusterOperator condition types
CLUSTER_OPERATOR_CONDITION_AVAILABLE
CLUSTER_OPERATOR_CONDITION_DEGRADED
CLUSTER_OPERATOR_CONDITION_PROGRESSING
CLUSTER_OPERATOR_CONDITION_UPGRADEABLE

// Condition status values
CONDITION_STATUS_TRUE
CONDITION_STATUS_FALSE
CONDITION_STATUS_UNKNOWN
```

### Intentionally Exported API

Some exports may appear "unused" in linting tools but are intentionally part of the public API:

- **Granular predicates** (`isOperatorDegraded`, `isOperatorUnavailable`, etc.) - Provide fine-grained checking for specific conditions
- **updateWorkflowConfigs** - Workflow configuration registry for introspection and testing
- **All constants** - Complete set of condition types and statuses for comprehensive state detection

These exports enable external code to:
1. Implement custom cluster state logic
2. Build additional UI components based on cluster conditions
3. Create test fixtures with realistic cluster states
4. Introspect workflow configurations

## Contributing

When modifying this code:

1. **Update tests first**: Add test case to `cluster-state-matrix.spec.ts`
2. **Check condition status**: Always check both `type` AND `status` fields
3. **Validate all states**: Run full test suite to ensure no regressions
4. **Update this README**: Document any new states or prompt variants
5. **Add inline comments**: Explain non-obvious decision logic
6. **Maintain public API**: Keep predicate exports stable for external consumers

## References

- [OpenShift ClusterVersion API](https://docs.openshift.com/container-platform/latest/rest_api/config_apis/clusterversion-config-openshift-io-v1.html)
- [ClusterOperator API](https://docs.openshift.com/container-platform/latest/rest_api/config_apis/clusteroperator-config-openshift-io-v1.html)
- [OLS Integration Design](https://issues.redhat.com/browse/CONSOLE-5118)
