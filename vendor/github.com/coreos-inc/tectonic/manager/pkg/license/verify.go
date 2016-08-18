package license

import (
	"fmt"
	"io"
	"io/ioutil"
	"strings"

	licensev2 "github.com/coreos-inc/soy/common/license"
	"github.com/coreos-inc/tectonic/manager/pkg/joseutil"
	licensev1 "github.com/coreos-inc/tectonic/manager/pkg/licensev1"
	"github.com/coreos/go-oidc/jose"
)

type licenseVersion string

const (
	LicenseVersion1 licenseVersion = "v1"
	LicenseVersion2 licenseVersion = "v2"
)

type LicenseDetails struct {
	Version       licenseVersion
	AccountID     string
	AccountSecret string
	LicenseJWT    jose.JWT
}

func Verify(publicKey, licenseFile io.Reader) (*LicenseDetails, error) {
	verifier, err := joseutil.NewVerifier(publicKey, "tectonic-enterprise")
	if err != nil {
		return nil, fmt.Errorf("error creating license verifier: %v", err)
	}

	licenseContents, err := ioutil.ReadAll(licenseFile)
	if err != nil {
		return nil, fmt.Errorf("error loading Tectonic license from %s: %v", licenseFile, err)
	}
	licenseData := strings.TrimSpace(string(licenseContents))

	jwt, err := jose.ParseJWT(licenseData)
	if err != nil {
		return nil, fmt.Errorf("error parsing license as JWT: %s", err)
	}
	claims, err := jwt.Claims()
	if err != nil {
		return nil, fmt.Errorf("error getting JWT claims: %s", err)
	}

	ok, err := licensev2.VerifyJWT(verifier, jwt)
	if err != nil {
		return nil, fmt.Errorf("unable to verify license: %s", err)
	} else if !ok {
		return nil, fmt.Errorf("license %s is not valid", licenseFile)
	}

	var details *LicenseDetails

	if v, ok := claims["version"]; ok && v == "1" {
		lic, err := licensev1.NewTectonicLicenseFromJWT(jwt)
		if err != nil {
			return nil, fmt.Errorf("error loading Tectonic license from %s: %v", licenseFile, err)
		}
		details = &LicenseDetails{
			AccountID:     lic.AccountID,
			AccountSecret: lic.ReportingSecret,
			Version:       LicenseVersion1,
		}

	} else if v, ok := claims["schemaVersion"]; ok && v == licensev2.LicenseSchemaVersion {
		lic, err := licensev2.NewLicenseFromJWT(jwt)
		if err != nil {
			return nil, fmt.Errorf("error loading Tectonic license from %s: %v", licenseFile, err)
		}
		details = &LicenseDetails{
			AccountID:     lic.AccountID,
			AccountSecret: lic.AccountSecret,
			Version:       LicenseVersion2,
		}
	} else {
		return nil, fmt.Errorf("unable to determine license version")
	}
	details.LicenseJWT = jwt
	return details, nil
}
