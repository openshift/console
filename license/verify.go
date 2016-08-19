package license

import (
	"io"
	"strings"
	"time"

	licenseReader "github.com/coreos-inc/soy/common/license"
	"github.com/coreos-inc/tectonic/manager/pkg/license"
	"github.com/coreos/pkg/capnslog"
)

var (
	log = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "license")
)

type subscriptionMap map[string]licenseReader.SubscriptionDef

// Verify determines the tier and expiration date of a given Tectonic license.
// When multiple subscriptions are found, it will select an unexpired license, if available.
// Afterwards, the selection will be filtered by choosing the highest available tier.
// Finally, if multiple subscriptions from the same tier are found, it will choose the newest,
// i.e. the subscription with the most recent start date.
func Verify(publicKey, file io.Reader, reference time.Time) (tier string, expiration time.Time) {
	tier = "unknown"
	expiration = reference

	details, err := license.Verify(publicKey, file)
	if err != nil {
		log.Warningf("Failed to verify license: %v", err)
		return
	}
	if details.Version != license.LicenseVersion2 {
		return
	}
	l, err := licenseReader.NewLicenseFromJWT(details.LicenseJWT)
	if err != nil {
		log.Warningf("Failed to parse license: %v", err)
		return
	}
	if l.ExpirationDate.Before(reference) {
		expiration = l.ExpirationDate
		log.Warningf("License token expired on %v.", expiration)
		return
	}
	subscriptions := subscriptionMap(l.Subscriptions)
	s := subscriptions.findTectonic()
	if len(*s) == 0 {
		log.Warning("No Tectonic subscriptions were found.")
		return
	}
	u := s.unexpired(reference)
	if len(*u) == 0 {
		u = s
		log.Warning("No unexpired subscriptions were found.")
	}
	subscription := u.findBestTier().newest()
	expiration = subscription.ServiceEnd
	tier = subscription.ProductName
	return
}

// unexpired will filter out all expired subscriptions from the subscription map.
func (s *subscriptionMap) unexpired(reference time.Time) *subscriptionMap {
	m := make(subscriptionMap)
	for k, v := range *s {
		if !isExpired(v, reference) {
			m[k] = v
		}
	}
	return &m
}

// findTectonic filters out all subscriptions that are not related to Tectonic.
// Matching is done naively by checking if the subscription's product name begins with the string "tectonic".
func (s *subscriptionMap) findTectonic() *subscriptionMap {
	m := make(subscriptionMap)
	for k, v := range *s {
		if strings.HasPrefix(v.ProductName, "tectonic") {
			m[k] = v
		}
	}
	return &m
}

// findTier filters out all subscriptions that do not match the provided tier.
// Matching is done naively by checking if the subscription's product name contains the given tier.
func (s *subscriptionMap) findTier(t string) *subscriptionMap {
	m := make(subscriptionMap)
	for k, v := range *s {
		if strings.Index(v.ProductName, t) != -1 {
			m[k] = v
		}
	}
	return &m
}

// findBestTier tries to return the highest value subscriptions from the given map.
// If enterprise subscriptions are avaiable, these are returned.
// Otherwise, if lab subscriptions are found, these will be returned.
// If neither enterprise nor lab subscriptions were found, then starter subscriptions are returned.
// Finally, if none of these licenses are found, the given map is returned.
func (s *subscriptionMap) findBestTier() *subscriptionMap {
	t := s.findTier("enterprise")
	if len(*t) > 0 {
		return t
	}
	t = s.findTier("lab")
	if len(*t) > 0 {
		return t
	}
	t = s.findTier("starter")
	if len(*t) > 0 {
		return t
	}
	return s
}

// isExpired simply returns true if the given subscription is expired and false otherwise.
func isExpired(s licenseReader.SubscriptionDef, reference time.Time) bool {
	return reference.Before(s.ServiceStart) || reference.After(s.ServiceEnd)
}

// newest reduces a given map of subscriptions to the most recent subscription.
// If the map is empty, then the returned value will be a nil pointer.
func (s *subscriptionMap) newest() *licenseReader.SubscriptionDef {
	var sub licenseReader.SubscriptionDef
	for _, v := range *s {
		if &sub == nil {
			sub = v
			continue
		}
		if v.ServiceStart.After(sub.ServiceStart) {
			sub = v
		}
	}
	return &sub
}
