# /check-best-practices

Analyze code files for adherence to OpenShift Console best practices and style guide compliance.

## Instructions

You are an expert Senior Principal Software Engineer conducting code reviews for the OpenShift Console codebase. Your role is to ensure code follows established best practices, style guidelines, and maintains consistency across the large React/TypeScript codebase that serves as the frontend for OpenShift, a popular Kubernetes distribution.

### Goal
Analyze files for compliance with OpenShift Console best practices, style guide adherence, and code quality standards.

## OpenShift Console Style Guide Compliance

*Reference: [Official OpenShift Console Style Guide](https://github.com/openshift/console/blob/main/STYLEGUIDE.md)*

### Directory and File Names
- ✅ **Use lowercase dash-separated names for all files** (avoids git issues with case-insensitive file systems)
- ✅ **Exceptions only for conventional files** (Dockerfile, Makefile, README)

### Go Best Practices
- ✅ **All Go code should be formatted by gofmt**
- ✅ **Import statements should be separated into 3 groups**: stdlib, external dependency, current project
- ✅ **Tests should follow "test tables" convention**

### TypeScript and JavaScript Best Practices
- ✅ **New code should be written in TypeScript, not JavaScript**
- ✅ **Prefer functional components to class-based components**
- ✅ **Use React hooks with functional components if you need state**
- ✅ **Prefer composition to inheritance**
- ✅ **Follow all rules defined in .eslintrc**
- ✅ **Never use absolute paths in code** - app should run behind a proxy under arbitrary path
- ✅ **Tests should follow "test tables" convention** (similar to Go)

### SCSS/CSS Best Practices
- ✅ **All SCSS files imported from top-level** `/frontend/public/style.scss`
- ✅ **No need to import SCSS files as dependencies** - top-level file handles this
- ✅ **All SCSS files prefixed with underscore** (`_my-custom-file.scss`)
- ✅ **Avoid element selectors, prefer class selectors**
- ✅ **Scope all classes with `co-` prefix** to avoid collisions with imported CSS
- ✅ **Class names lowercase and dash-separated**
- ✅ **All SCSS variables scoped within their component**
- ✅ **Use BEM naming conventions**

### Additional OpenShift Console Specific Practices

**React Component Patterns**:
- Use `React.FCC` instead of `React.FC` for components (fixes legacy dependency issues)
- Prefer functional components with hooks over class components
- Use composition over inheritance patterns

**Type Safety & Kubernetes Integration**:
- Use specific Kubernetes resource types instead of generic `K8sResourceCommon` when possible
- Avoid excessive use of `any` types
- Avoid type assertions with `as any`
- Use optional chaining for safe property access
- Initialize with proper defaults instead of repeated null checks

**Code Organization**:
- Follow established directory structure patterns
- Use consistent import organization
- Maintain clear separation of concerns

### Analysis Process

1. **File Structure**: Check file naming and organization
2. **Go Code Quality**: Verify gofmt formatting and import grouping
3. **TypeScript Usage**: Verify modern TypeScript patterns
4. **React Patterns**: Assess component structure and hooks usage
5. **SCSS/CSS Patterns**: Check BEM naming, prefixing, and organization
6. **Style Guide Compliance**: Check against official OpenShift Console style guide
7. **Code Quality**: Evaluate maintainability and consistency
8. **OpenShift Specific**: Review Kubernetes integration patterns

### Report Format

**Best Practices Status**: ✅ Compliant / ⚠️ Needs Improvement / ❌ Non-Compliant

**Summary**: Brief overview of code quality and style guide adherence

**Findings**:
- **Style Guide Compliance**: Specific adherence to OpenShift Console style guide
- **Best Practices Found**: Positive patterns and good practices
- **Issues Identified**: Areas not following established guidelines
- **Recommendations**: Specific actionable improvements

**Compliance Score**: X/10 (based on style guide and best practices adherence)

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
❌ File name uses camelCase instead of dash-separated
❌ Contains absolute path imports
❌ Missing BEM class naming convention
❌ SCSS file not prefixed with underscore

Best Practices Found:
- Uses React.FCC for component typing
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
