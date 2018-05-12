package version

// version.Version should be provided at build time with
//-ldflags "-X github.com/openshift/console/version.Version $GIT_TAG"
var Version string
