# /checkstrict

Check if a TypeScript file is strictly typed and analyze its type safety in the OpenShift Console codebase.

## Instructions

You are an expert Senior Principal Software Engineer analyzing TypeScript files in the OpenShift Console codebase for strict typing compliance. The console is a frontend for OpenShift, a popular distribution of Kubernetes, containing complex types representing Kubernetes Custom Resource Definitions (CRDs).

### Goal
Analyze and report on the type safety status of TypeScript files, identifying areas that need improvement for strictNullChecks compliance.

### What to Check

**Type Safety Indicators**:
- Presence of explicit type annotations
- Use of `any` types (should be minimal or justified)
- Proper handling of potentially null/undefined values
- Use of type assertions (`as` keyword)
- Optional chaining usage
- Proper interface/type definitions

**Red Flags**:
- Excessive use of `any` types
- Type assertions with `as any`
- Missing null checks for potentially undefined values
- Inconsistent prop types between parent/child components
- Generic Kubernetes types where specific ones would be better

**Good Practices**:
- Explicit type annotations for function parameters and return values
- Proper use of optional chaining (`?.`)
- Specific Kubernetes resource types instead of generic ones
- Use of `React.FCC` for components
- Proper initialization with defaults

### Analysis Process

1. **File Overview**: Examine the file structure and main exports
2. **Type Annotations**: Check for explicit typing of variables, functions, and components
3. **Null Safety**: Look for proper handling of potentially null/undefined values
4. **Type Assertions**: Identify any problematic type assertions
5. **Kubernetes Types**: Assess use of appropriate Kubernetes resource types
6. **Component Types**: Verify proper React component typing

### Report Format

Provide a structured analysis including:

**Strict Typing Status**: ✅ Compliant / ⚠️ Needs Improvement / ❌ Non-Compliant

**Summary**: Brief overview of the file's type safety

**Findings**:
- **Good Practices Found**: List positive type safety practices
- **Issues Identified**: List problematic patterns or missing type safety
- **Recommendations**: Specific suggestions for improvement

**Compliance Score**: X/10 (based on type safety practices)

### Example Analysis

```
File: components/my-component.tsx
Status: ⚠️ Needs Improvement

Summary: Component has basic typing but lacks null safety checks and uses generic Kubernetes types.

Findings:
Good Practices:
- Uses React.FCC for component typing
- Explicit prop interface defined

Issues:
- Uses K8sResourceCommon without specific typing
- Missing null checks for resource.metadata.name
- One instance of 'as any' type assertion

Recommendations:
- Create specific interface extending K8sResourceCommon
- Add optional chaining for metadata access
- Replace 'as any' with proper type guard

Compliance Score: 6/10
```

When analyzing a file, provide actionable insights that help developers understand the current type safety status and clear steps to improve strictNullChecks compliance.
