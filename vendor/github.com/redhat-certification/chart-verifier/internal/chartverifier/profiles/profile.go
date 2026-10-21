package profiles

import (
	"fmt"
	"regexp"
	"strings"

	"golang.org/x/mod/semver"
	"gopkg.in/yaml.v3"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/utils"
	"github.com/redhat-certification/chart-verifier/internal/profileconfig"
	apiChecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
)

type (
	Annotation    string
	VendorType    string
	VendorVersion string
)

const (
	DigestAnnotation                 Annotation = "Digest"
	OCPVersionAnnotation             Annotation = "OCPVersion"
	TestedOCPVersionAnnotation       Annotation = "TestedOpenShiftVersion"
	LastCertifiedTimestampAnnotation Annotation = "LastCertifiedTimestamp"
	SupportedOCPVersionsAnnotation   Annotation = "SupportedOpenShiftVersions"

	VendorTypeConfigName string = "profile.vendortype"
	VersionConfigName    string = "profile.version"

	VendorTypeDefault      VendorType = "default"
	VendorTypeNotSpecified VendorType = "vendorTypeNotSpecified"
)

var profileMap map[VendorType][]*Profile

func init() {
	profileMap = make(map[VendorType][]*Profile)
	getProfiles()

	// add default profile to the map if a default profile was not found.
	if _, ok := profileMap[VendorTypeDefault]; !ok {
		profileMap[VendorTypeDefault] = profileMap[DefaultProfile]
	}
}

type Profile struct {
	Apiversion  string       `json:"apiversion" yaml:"apiversion"`
	Kind        string       `json:"kind" yaml:"kind"`
	Name        string       `json:"name" yaml:"name"`
	Vendor      VendorType   `json:"vendorType" yaml:"vendorType"`
	Version     string       `json:"version" yaml:"version"`
	Annotations []Annotation `json:"annotations" yaml:"annotations"`
	Checks      []*Check     `json:"checks" yaml:"checks"`
}

type Check struct {
	Name string              `json:"name" yaml:"name"`
	Type apiChecks.CheckType `json:"type" yaml:"type"`
}

type FilteredRegistry map[apiChecks.CheckName]checks.Check

var profileInUse *Profile

func Get() *Profile {
	if profileInUse == nil {
		return getDefaultProfile("No profile set for get")
	}
	return profileInUse
}

func New(values map[string]interface{}) *Profile {
	profileVendorType := VendorTypeDefault
	var profileVersion string
	if values != nil {
		if vendorType, ok := values[VendorTypeConfigName]; ok {
			profileVendorType = VendorType(strings.ToLower(fmt.Sprintf("%v", vendorType)))
		}

		if version, ok := values[VersionConfigName]; ok {
			versionString := (fmt.Sprintf("%v", version))
			if semver.IsValid(versionString) {
				profileVersion = versionString
			}
		}
	}

	profileInUse = getDefaultProfile(fmt.Sprintf("profile %s not found", profileVendorType))

	if vendorProfiles, ok := profileMap[profileVendorType]; ok {
		if len(vendorProfiles) > 0 {
			profileInUse = vendorProfiles[0]
			if len(vendorProfiles) > 1 {
				for _, vendorProfile := range vendorProfiles {
					if len(profileVersion) > 0 {
						if semver.Compare(semver.MajorMinor(vendorProfile.Version), semver.MajorMinor(profileVersion)) == 0 {
							profileInUse = vendorProfile
							break
						}
					}
					if semver.Compare(semver.MajorMinor(vendorProfile.Version), semver.MajorMinor(profileInUse.Version)) > 0 {
						profileInUse = vendorProfile
					}
				}
			}
		}
	}
	utils.LogInfo(fmt.Sprintf("Profile in use: %s %s", profileInUse.Vendor, profileInUse.Version))
	return profileInUse
}

// Get all profiles in the profiles directory, and any subdirectories, and add each to the profile map
func getProfiles() {
	profileFiles, err := profileconfig.GetProfiles()
	if err != nil {
		return
	}
	for _, profileFile := range profileFiles {
		if strings.HasSuffix(profileFile.Name, ".yaml") {
			profileRead, err := readProfile(profileFile.Data)
			if err == nil {
				// If version is not valid set to a default version
				if !semver.IsValid(profileRead.Version) {
					profileRead.Version = DefaultProfileVersion
				}
				if len(profileRead.Vendor) == 0 {
					profileRead.Vendor = VendorTypeNotSpecified
				}
				profileMap[profileRead.Vendor] = append(profileMap[profileRead.Vendor], profileRead)
				profileRead.Name = strings.Split(profileFile.Name, ".yaml")[0]
			}
		}
	}
}

func (profile *Profile) FilterChecks(registry checks.DefaultRegistry) FilteredRegistry {
	filteredChecks := make(map[apiChecks.CheckName]checks.Check)

	for _, check := range profile.Checks {
		splitter := regexp.MustCompile(`/`)
		splitCheck := splitter.Split(check.Name, -1)
		checkIndex := checks.CheckID{Name: apiChecks.CheckName(splitCheck[1]), Version: splitCheck[0]}
		if newCheck, ok := registry[checkIndex]; ok {
			newCheck.Type = check.Type
			filteredChecks[checkIndex.Name] = newCheck
		}
	}

	return filteredChecks
}

func readProfile(profileBytes []byte) (*Profile, error) {
	profile := &Profile{}
	err := yaml.Unmarshal(profileBytes, profile)
	if err != nil {
		return nil, err
	}

	return profile, nil
}
