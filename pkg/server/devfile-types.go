package server

import (
	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
)

type formData struct {
	Name                     string            `json:"name"`
	Namespace                string            `json:"namespace"`
	Project                  project           `json:"project"`
	Application              application       `json:"application"`
	Route                    route             `json:"route"`
	Build                    build             `json:"build"`
	Deployment               deployment        `json:"deployment"`
	Git                      git               `json:"git"`
	Devfile                  devfile           `json:"devfile"`
	Image                    image             `json:"image"`
	UserLabls                map[string]string `json:"userLabels"`
	Limits                   limits            `json:"limits"`
	Pipeline                 pipeline          `json:"pipeline"`
	Resources                resources         `json:"resources"`
	Healthchecks             heathChecksData   `json:"healthchecks"`
	RouteSpec                routeSpec         `json:"routeSpec"`
	ImageStreamName          string            `json:"imageStreamName"`
	GeneratedImageStreamName string            `json:"generatedImageStreamName"`
	DefaultLabels            map[string]string `json:"defaultLabels"`
	Annotations              map[string]string `json:"annotations"`
	DefaultAnnotations       map[string]string `json:"defaultAnnotations"`
	// webhookTriggerData: webhookTriggerData,
	WebhookSecret string            `json:"webhookSecret"`
	ProbesData    heathChecksData   `json:"probesData"`
	PodLabels     map[string]string `json:"podLabels"`
}

type devfileResources struct {
	ImageStream imagev1.ImageStream `json:"imageStream"`
	// This can be enhanced to include BuildResource Type that includes all possible types of build objects(eg buildConfig, build pod etc)
	BuildResource buildv1.BuildConfig `json:"buildResource"`
	// This can be enhanced to include Deploy Resource Type that includes all possible types of deployment objects(eg deployment, deploymentConfig, helm chart etc)
	DeployResource appsv1.Deployment `json:"deployResource"`
	Service        corev1.Service    `json:"service"`
	Route          routev1.Route     `json:"route"`
}

type project struct {
	Name string `json:"name"`
}

type application struct {
	Name string `json:"name"`
}

type route struct {
	CanCreateRoute bool `json:"create"`
	Disable        bool `json:"disable"`
}

type build struct {
	Env      []corev1.EnvVar `json:"env"`
	Strategy string          `json:"strategy"`
	Triggers triggers        `json:"triggers"`
}

type deployment struct {
	Env      []corev1.EnvVar `json:"env"`
	Replicas *int32          `json:"replicas"`
	Triggers triggers        `json:"triggers"`
}

type triggers struct {
	Webhook bool `json:"webhook"`
	Image   bool `json:"image"`
	Config  bool `json:"config"`
}

type git struct {
	URL    string `json:"url"`
	Type   string `json:"type"`
	Ref    string `json:"ref"`
	Dir    string `json:"dir"`
	Secret string `json:"secret"`
}

type devfile struct {
	DevfileContent string `json:"devfileContent"`
	DevfilePath    string `json:"devfilePath"`
}

type image struct {
	Ports []corev1.ContainerPort `json:"ports"`
	Tag   string                 `json:"tag"`
}

type containerPort struct {
	Name          string `json:"name"`
	ContainerPort int    `json:"containerPort"`
	Protocol      string `json:"protocol"`
}

type limits struct {
	CPU    resourceType `json:"cpu"`
	Memory resourceType `json:"memory"`
}

type resourceType struct {
	Request            string `json:"request"`
	RequestUnit        string `json:"requestUnit"`
	DefaultRequestUnit string `json:"defaultRequestUnit"`
	Limit              string `json:"limit"`
	LimitUnit          string `json:"limitUnit"`
	DefaultLimitUnit   string `json:"defaultLimitUnit"`
}

type pipeline struct {
	Enabled bool `json:"enabled"`
}

type resources struct {
	Resources string `json:"resources"`
}

type heathChecksData struct {
	ReadinessProble corev1.Probe `json:"readinessProbe"`
	LivenessProbe   corev1.Probe `json:"livenessProbe"`
	StartupProbe    corev1.Probe `json:"startupProbe"`
}

type healthCheckProbe struct {
	ShowForm bool `json:"showForm"`
	Enabled  bool `json:"enabled"`
	Modified bool `json:"modified"`
}

type healthCheckProbeData struct {
	FailureThreshold    int       `json:"failureThreshold"`
	RequestType         string    `json:"requestType"`
	HTTPGet             httpGet   `json:"httpGet"`
	TCPSocket           tcpSocket `json:"tcpSocket"`
	Exec                exec      `json:"exec"`
	InitialDelaySeconds int       `json:"initialDelaySeconds"`
	PeriodSeconds       int       `json:"periodSeconds"`
	TimeoutSeconds      int       `json:"timeoutSeconds"`
	SuccessThreshold    int       `json:"successThreshold"`
}

type httpGet struct {
	Scheme      string          `json:"scheme"`
	Path        string          `json:"path"`
	Port        int             `json:"port"`
	HTTPHeaders []nameValuePair `json:"httpHeaders"`
}

type nameValuePair struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type tcpSocket struct {
	Port int `json:"port"`
}

type exec struct {
	Command []string `json:"command"`
}

type routeSpec struct {
	Hostname   string  `json:"hostname"`
	Secure     bool    `json:"secure"`
	Path       string  `json:"path"`
	TargetPort string  `json:"targetPort"`
	TLS        tlsData `json:"tls"`
}

type tlsData struct {
	Termination                   string `json:"termination"`
	InsecureEdgeTerminationPolicy string `json:"insecureEdgeTerminationPolicy"`
	Certificate                   string `json:"certificate"`
	PrivateKey                    string `json:"privateKey"`
	CaCertificate                 string `json:"caCertificate"`
	DestinationCACertificate      string `json:"destinationCACertificate"`
}
