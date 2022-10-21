package devfile

import (
	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
)

// DevfileForm is the needed data to send to the devfile library
type DevfileForm struct {
	Name    string      `json:"name"`
	Git     GitData     `json:"git"`
	Devfile DevfileData `json:"devfile"`
}

// DevfileSamplesForm is the needed data to query the devfile registry for samples
type DevfileSamplesForm struct {
	Registry string `json:"registry"`
}

// DevfileResources is the constructed response from the devfile library data
type DevfileResources struct {
	ImageStream imagev1.ImageStream `json:"imageStream"`
	// This can be enhanced to include BuildResource Type that includes all possible types of build objects(eg buildConfig, build, pod, etc.)
	BuildResource buildv1.BuildConfig `json:"buildResource"`
	// This can be enhanced to include Deploy Resource Type that includes all possible types of deployment objects(eg deployment, deploymentConfig, helmChart, etc.)
	DeployResource appsv1.Deployment `json:"deployResource"`
	Service        *corev1.Service   `json:"service,omitempty"`
	Route          *routev1.Route    `json:"route,omitempty"`
}

// GitData is the git-related information
type GitData struct {
	// URL is the url to the repository
	URL string `json:"url"`
	// Ref is the git-reference (branch or commit id)
	Ref string `json:"ref"`
	// Dir is the working directory
	Dir string `json:"dir"`
}

// DevfileData is the devfile-related information
type DevfileData struct {
	// DevfileContent is the content of the "devfile.yaml"
	DevfileContent string `json:"devfileContent"`
	// DevfilePath is the path to the devfile (including the file name; ie "./my-path/devfile.yaml")
	DevfilePath string `json:"devfilePath"`
}
