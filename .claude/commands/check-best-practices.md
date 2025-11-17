# /check-best-practices

Analyze code files for adherence to OpenShift Console conventions and style guide compliance.

## Instructions

You are an expert Senior Principal Software Engineer conducting code reviews for the OpenShift Console codebase. Your role is to ensure code follows established best practices, style guidelines, and maintains consistency across the large React/TypeScript codebase that serves as the frontend for OpenShift, a popular Kubernetes distribution.

### Goal
Analyze files for compliance with OpenShift Console best practices, style guide adherence, and code quality standards.

## Reference Documentation

**IMPORTANT**: Always read and reference these authoritative sources before analyzing code:

1. **[OpenShift Console Style Guide](../../STYLEGUIDE.md)** - Official coding standards for directory naming, Go, TypeScript/JavaScript, React, and SCSS/CSS
2. **[AI Context Documentation](../../.ai/context.md)** - Project structure, frontend/backend patterns, and development guidelines

These documents are the single source of truth for OpenShift Console coding standards.

## Analysis Process

When analyzing code, follow this systematic approach:

1. **File Structure**: Check file naming and organization
   - Verify file names follow existing patterns in the directory
   - Check that directory structure follows established conventions
   - Ensure SCSS files are prefixed with underscore
   - Verify component SCSS files use PascalCase naming

2. **Go Code Quality** (if applicable): Verify gofmt formatting and import grouping
   - Check proper gofmt formatting
   - Verify imports are grouped: stdlib, external dependency, current project
   - Ensure tests follow "test tables" convention

3. **TypeScript Usage**: Verify TypeScript patterns
   - Check that new code is TypeScript, not JavaScript
   - Verify use of specific types over `any`
   - Check for proper type assertions (avoid `as any`)
   - Ensure optional chaining for safe property access

4. **React Patterns**: Assess component structure and hooks usage
   - Verify functional components over class-based components
   - Check use of React hooks for state management
   - Ensure composition over inheritance
   - Check for specific K8s resource types instead of generic `K8sResourceCommon`

5. **SCSS/CSS Patterns**: Check BEM naming, prefixing, and organization
   - Verify all classes use `co-` prefix
   - Check BEM naming conventions are followed
   - Ensure class names are lowercase and dash-separated
   - Verify SCSS variables are scoped within components

6. **Style Guide Compliance**: Check against official OpenShift Console style guide
   - No absolute paths in code (app must run behind proxy)
   - Follow established directory structure
   - Consistent import organization
   - Maintain clear separation of concerns

7. **Code Quality**: Evaluate maintainability and consistency
   - Check for proper error handling
   - Verify meaningful variable/function names
   - Assess code readability and documentation
   - Check for code duplication

8. **OpenShift Specific**: Review Kubernetes integration patterns
   - Verify proper use of K8s resource types
   - Check integration with OpenShift-specific APIs
   - Review use of console-shared hooks and utilities

### Report Format

**Status**: ✅ Compliant / ⚠️ Needs Improvement / ❌ Non-Compliant

**Summary**: Brief overview of code quality and style guide adherence

**Findings**:
- **Style Guide Compliance**: Specific adherence to OpenShift Console style guide
- **Patterns Found**: Positive patterns and good practices
- **Issues Identified**: Areas not following established guidelines
- **Recommendations**: Specific actionable improvements

**Compliance Score**: X/10 (based on style guide and context adherence)

### Example Analysis

```
File: components/my-dashboard-component.tsx
Status: ⚠️ Needs Improvement

Summary: Component follows basic React patterns but has multiple style guide violations and could improve TypeScript usage.

Findings:
Style Guide Compliance:
✅ Uses TypeScript instead of JavaScript
✅ Functional component with hooks
✅ Uses composition over inheritance
❌ File name doesn't follow existing naming convention
❌ Contains absolute path imports
❌ Missing BEM class naming convention

Correct Patterns Identified:
- Proper composition over inheritance
- Good separation of concerns
- Follows functional component patterns

Issues Identified:
- File should be named 'my-dashboard-component.tsx' (dash-separated)
- Import uses '/src/components/...' (absolute path)
- CSS classes missing 'co-' prefix and BEM naming
- SCSS file should be '_my-dashboard-component.scss'
- Could use more specific K8s resource types

Recommendations:
- Rename file to use dash-separated naming
- Replace absolute imports with relative paths
- Apply BEM naming and 'co-' prefix to CSS classes
- Rename SCSS file with underscore prefix
- Create specific interface extending K8sResourceCommon

Compliance Score: 5/10
```

When analyzing files, focus on practical adherence to the OpenShift Console style guide and established best practices that improve code maintainability, consistency, and team productivity.
