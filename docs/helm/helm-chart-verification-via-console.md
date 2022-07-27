# Helm Chart Verification

Chart-verifier is a CLI tool that runs a series of independent checks defined in different profiles. This CLI tool is used to validate the Helm chart against a configurable list of checks through an automated Red Hat OpenShift certification workflow. Certification assures the integrity of the chart and ensures that the Helm chart works seamlessly on Red Hat OpenShift clusters.

## Types of Helm chart checks
Helm chart checks are a set of checks against which the Red Hat Helm chart-verifier tool verifies and validates whether a Helm chart is qualified for a certification from Red Hat. These checks contain metadata that have certain parameters and values with which a Helm chart must comply to be certified by Red Hat. A Red Hat-certified Helm chart qualifies in terms of readiness for distribution in the [OpenShift Helm Chart Repository](https://github.com/openshift-helm-charts).

### Table 1: Helm chart check types

Helm chart checks are categorized into the following types:

| Check type | Description
|---|---
| Mandatory | Checks are required to pass and be successful for certification.
| Recommended | Checks are about to become mandatory; we recommend fixing any check failures.
| Optional | Checks are ready for customer testing. Checks can fail and still pass the verification for certification.
| Experimental | New checks introduced for testing purposes or beta versions.
> **_NOTE:_**  The current release of the chart-verifier includes only the mandatory and optional type of checks.

## Default set of checks for a Helm chart

The `/api/helm/verify` Helm chart-verifier API integrates the chart-verifier CLI tool on Openshift Developer Console (ODC). This API provides users more insight into whether the Helm charts that they are targeting run well on OpenShift. The following checks are run when the user needs to verify their Helm chart from the console:

### Table 2: Helm chart default checks
These are the checks will are enabled for `developer-console` profile. A chart is validated with the following checks:

| Checks | Description |
|---|---|
| IsHelmV3 | Checks that the given `uri` points to a Helm v3 chart. |
| HasReadme | Checks that the Helm chart contains the `README.md` file. |
| HasKubeVersion | Checks that the `Chart.yaml` file of the Helm chart includes the `kubeVersion` field (v1.0) and is a valid semantic version (v1.1). |
| ContainsValuesSchema | Checks that the Helm chart contains a JSON schema file (`values.schema.json`) to validate the `values.yaml` file in the chart. |
|  HelmLint | Checks that the chart is well formed by running the `helm lint` command. |
| ContainsValues | Checks that the Helm chart contains the `values`[¹](https://github.com/redhat-certification/chart-verifier/blob/main/docs/helm-chart-checks.md#-for-more-information-on-the-values-file-see-values-and-best-practices-for-using-values) file. |

A chart that goes through the certification process verifies that the Helm chart is compliant with the predefined set of independent checks and is recommended for use.

The output of the chart-verifier API is a JSON-encoded [response ](https://github.com/redhat-certification/chart-verifier/blob/main/pkg/chartverifier/reportsummary/types.go#L39-43).

## Additional Resources
For more information on `chart-verifier`, see [RedHat Chart Verifier](https://github.com/redhat-certification/chart-verifier).