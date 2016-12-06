package verify

import (
	"crypto/rsa"
	"fmt"
	"time"

	"github.com/coreos-inc/tectonic-licensing/license"
	"github.com/coreos-inc/tectonic-licensing/tectonic-kubernetes"
	"github.com/coreos/pkg/capnslog"
)

var (
	log = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "license")
)

// Verify determines license details of a given Tectonic license, parsed by tectonic-licensing.
func Verify(publicKey string, file string, reference time.Time) (expiration time.Time, graceExpiration time.Time, entitlementKind string, entitlementCount int64, licenseError error) {
	pubkey, err := license.LoadPublicKey([]byte(publicKey))
	if err != nil {
		licenseError = fmt.Errorf("Failed to parse pubkey: %v", err)
		log.Warning(licenseError)
		return
	}
	l, err := license.Decode(pubkey.(*rsa.PublicKey), file)
	if err != nil {
		licenseError = err
		log.Warning(licenseError)
		return
	}

	licenseDetails := teckubelicense.GetLicenseDetails(l, reference)
	expiration = licenseDetails.SubscriptionEnd()
	graceExpiration = licenseDetails.GracePeriodEnd()

	if expiration.Before(reference) {
		return
	}

	enforce := true
	entitlementKind, entitlementCount, enforce, err = teckubelicense.GetEnforcementKindAndCount(licenseDetails, reference)
	if err != nil {
		licenseError = err
		log.Warning(licenseError)
		return
	}

	if enforce && entitlementKind == "" && entitlementCount == 0 {
		licenseError = fmt.Errorf("Failed to find entitlement")
		log.Warning(licenseError)
		return
	}

	return
}
