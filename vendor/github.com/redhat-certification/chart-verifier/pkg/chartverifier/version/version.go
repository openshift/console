package version

import (
	_ "embed"
	"encoding/json"
	"fmt"

	"golang.org/x/mod/semver"
)

var verifierVersion string

//go:embed version_info.json
var versionFileContent []byte

type Version struct {
	Version string `json:"version"`
}

func init() {
	version := Version{}
	// we unmarshal our byteArray which contains our
	// jsonFile's content into 'users' which we defined above
	err := json.Unmarshal(versionFileContent, &version)
	if err != nil {
		verifierVersion = "0.0.3"
		return
	}

	if semver.IsValid(fmt.Sprintf("v%s", version.Version)) {
		verifierVersion = version.Version
	} else {
		verifierVersion = "0.0.4"
	}
}

func GetVersion() string {
	return verifierVersion
}
