package version

// version.Version should be provided at build time with
//-ldflags "-X github.com/coreos-inc/bridge/version.Version $GIT_TAG"
var Version string
