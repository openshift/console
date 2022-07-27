package checks

const (
	HasReadme                  CheckName = "has-readme"
	IsHelmV3                   CheckName = "is-helm-v3"
	ContainsTest               CheckName = "contains-test"
	ContainsValues             CheckName = "contains-values"
	ContainsValuesSchema       CheckName = "contains-values-schema"
	HasKubeVersion             CheckName = "has-kubeversion"
	NotContainsCRDs            CheckName = "not-contains-crds"
	HelmLint                   CheckName = "helm-lint"
	NotContainCsiObjects       CheckName = "not-contain-csi-objects"
	ImagesAreCertified         CheckName = "images-are-certified"
	ChartTesting               CheckName = "chart-testing"
	RequiredAnnotationsPresent CheckName = "required-annotations-present"

	MandatoryCheckType    CheckType = "Mandatory"
	OptionalCheckType     CheckType = "Optional"
	ExperimentalCheckType CheckType = "Experimental"
)

var setCheckNames = []CheckName{ChartTesting,
	ContainsTest,
	ContainsValuesSchema,
	ContainsValues,
	HasKubeVersion,
	HasReadme,
	HelmLint,
	ImagesAreCertified,
	IsHelmV3,
	NotContainCsiObjects,
	NotContainsCRDs,
	RequiredAnnotationsPresent}

func GetChecks() []CheckName {
	return setCheckNames
}
