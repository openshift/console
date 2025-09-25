package olm

const (
	CatalogdAllEndpoint = "/api/v1/all"

	// OLM annotations
	CapabilitiesOLMAnnotationKey           = "capabilities"
	CategoriesOLMAnnotationKey             = "categories"
	CNFOLMAnnotationKey                    = "features.operators.openshift.io/cnf"
	CNIOLMAnnotationKey                    = "features.operators.openshift.io/cni"
	CreatedAtOLMAnnotationKey              = "createdAt"
	CSIOLMAnnotationKey                    = "features.operators.openshift.io/csi"
	DescriptionOLMAnnotationKey            = "description"
	DisconnectedOLMAnnotationKey           = "features.operators.openshift.io/disconnected"
	DisplayNameOLMAnnotationKey            = "displayName"
	FIPSCompliantOLMAnnotationKey          = "features.operators.openshift.io/fips-compliant"
	InfrastructureFeaturesOLMAnnotationKey = "operators.openshift.io/infrastructure-features"
	ProxyAwareOLMAnnotationKey             = "features.operators.openshift.io/proxy-aware"
	RepositoryOLMAnnotationKey             = "repository"
	SupportOLMAnnotationKey                = "support"
	TLSProfilesOLMAnnotationKey            = "features.operators.openshift.io/tls-profiles"
	TokenAuthAWSOLMAnnotationKey           = "features.operators.openshift.io/token-auth-aws"
	TokenAuthAzureOLMAnnotationKey         = "features.operators.openshift.io/token-auth-azure"
	TokenAuthGCPOLMAnnotationKey           = "features.operators.openshift.io/token-auth-gcp"
	ValidSubscriptionOLMAnnotationKey      = "operators.openshift.io/valid-subscription"
)

var infrastructureFeatureAnnotations = []string{
	DisconnectedOLMAnnotationKey,
	FIPSCompliantOLMAnnotationKey,
	ProxyAwareOLMAnnotationKey,
	CNFOLMAnnotationKey,
	CNIOLMAnnotationKey,
	CSIOLMAnnotationKey,
	TLSProfilesOLMAnnotationKey,
	TokenAuthAWSOLMAnnotationKey,
	TokenAuthAzureOLMAnnotationKey,
	TokenAuthGCPOLMAnnotationKey,
}
