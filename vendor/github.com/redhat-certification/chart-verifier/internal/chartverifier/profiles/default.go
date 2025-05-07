package profiles

import (
	"fmt"

	apiChecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
)

const (
	CheckVersion10        = "v1.0"
	CheckVersion11        = "v1.1"
	DefaultProfile        = "partner"
	DefaultProfileVersion = "v1.3"
)

func getDefaultProfile(msg string) *Profile {
	profile := Profile{}

	profile.Apiversion = "v1"
	profile.Kind = "verifier-profile"

	profile.Name = "default-profile"
	if len(msg) > 0 {
		profile.Name = fmt.Sprintf("%s : %s", profile.Name, msg)
	}

	profile.Vendor = DefaultProfile
	profile.Version = DefaultProfileVersion

	profile.Annotations = []Annotation{DigestAnnotation, TestedOCPVersionAnnotation, LastCertifiedTimestampAnnotation, SupportedOCPVersionsAnnotation}

	profile.Checks = []*Check{
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.HasReadme), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.IsHelmV3), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.ContainsTest), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.ContainsValues), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.ContainsValuesSchema), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion11, apiChecks.HasKubeVersion), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.NotContainsCRDs), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.HelmLint), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.NotContainCsiObjects), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion11, apiChecks.ImagesAreCertified), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.ChartTesting), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.RequiredAnnotationsPresent), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.SignatureIsValid), Type: apiChecks.MandatoryCheckType},
		{Name: fmt.Sprintf("%s/%s", CheckVersion10, apiChecks.HasNotes), Type: apiChecks.OptionalCheckType},
	}

	return &profile
}
