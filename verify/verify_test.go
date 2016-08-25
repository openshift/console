package verify

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"io"
	"reflect"
	"strings"
	"testing"
	"time"

	licenseReader "github.com/coreos-inc/soy/common/license"
	"github.com/coreos-inc/tectonic/manager/pkg/joseutil"
)

var (
	now               time.Time       = time.Now().UTC()
	hour              time.Duration   = time.Hour
	testSubscriptions subscriptionMap = subscriptionMap{
		"tectonic_enterprise_expired_early": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-enterprise",
			ServiceStart: now.Add(hour),
			ServiceEnd:   now.Add(2 * hour),
		},
		"tectonic_enterprise_expired_late": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-enterprise",
			ServiceStart: now.Add(-2 * hour),
			ServiceEnd:   now.Add(-1 * hour),
		},
		"tectonic_enterprise_expired_backwards": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-enterprise",
			ServiceStart: now,
			ServiceEnd:   now.Add(-1 * hour),
		},
		"tectonic_enterprise_expired_backwards_late": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-enterprise",
			ServiceStart: now.Add(-1 * hour),
			ServiceEnd:   now.Add(-2 * hour),
		},
		"tectonic_enterprise_valid": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-enterprise",
			ServiceStart: now.Add(-10 * hour),
			ServiceEnd:   now.Add(10 * hour),
		},
		"tectonic_starter_valid": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-starter",
			ServiceStart: now.Add(-10 * hour),
			ServiceEnd:   now.Add(10 * hour),
		},
		"tectonic_starter_valid_oldest": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-starter",
			ServiceStart: now.Add(-100 * hour),
			ServiceEnd:   now.Add(10 * hour),
		},
		"tectonic_starter_expired": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-starter",
			ServiceStart: now.Add(-10 * hour),
			ServiceEnd:   now.Add(-10 * hour),
		},
		"tectonic_starter_expired_newest": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-starter",
			ServiceStart: now.Add(-2 * hour),
			ServiceEnd:   now.Add(-1 * hour),
		},
		"tectonic_starter_valid_newest": licenseReader.SubscriptionDef{
			ProductName:  "tectonic-starter",
			ServiceStart: now.Add(-1 * hour),
			ServiceEnd:   now.Add(1 * hour),
		},
		"quay_starter_valid": licenseReader.SubscriptionDef{
			ProductName:  "quay-starter",
			ServiceStart: now.Add(-1 * hour),
			ServiceEnd:   now.Add(1 * hour),
		},
		"quay_enterprise_valid": licenseReader.SubscriptionDef{
			ProductName:  "quay-enterprise",
			ServiceStart: now.Add(-1 * hour),
			ServiceEnd:   now.Add(1 * hour),
		},
	}
)

func TestIsExpired(t *testing.T) {
	for k, v := range testSubscriptions {
		want := strings.Split(k, "_")[2] == "expired"
		got := isExpired(v, now)
		if want != got {
			t.Errorf("Case %s: Expected %t, got %t", k, want, got)
		}
	}
}

func TestUnexpired(t *testing.T) {
	want := 0
	for k, _ := range testSubscriptions {
		if strings.Split(k, "_")[2] == "valid" {
			want++
		}
	}
	got := len(*testSubscriptions.unexpired(now))
	if want != got {
		t.Errorf("Expected %d unexpired subscriptions, got %d", want, got)
	}
}

func TestFindTectonic(t *testing.T) {
	want := 0
	for k, _ := range testSubscriptions {
		if strings.Split(k, "_")[0] == "tectonic" {
			want++
		}
	}
	got := len(*testSubscriptions.findTectonic())
	if want != got {
		t.Errorf("Expected %d Tectonic subscriptions, got %d", want, got)
	}
}

func TestFindTier(t *testing.T) {
	tiers := make(map[string]int)
	for k, _ := range testSubscriptions {
		t := strings.Split(k, "_")[1]
		tiers[t]++
	}
	for k, v := range tiers {
		want := v
		got := len(*testSubscriptions.findTier(k))
		if want != got {
			t.Errorf("Case %s: Expected %d subscriptions, got %d", k, want, got)
		}
	}
}

func TestFindBestTier(t *testing.T) {
	want := 0
	for k, _ := range testSubscriptions {
		if strings.Split(k, "_")[1] == "enterprise" {
			want++
		}
	}

	got := len(*testSubscriptions.findBestTier())
	if want != got {
		t.Errorf("Case: enterprise: Expected %d subscriptions, got %d", want, got)
	}

	testSubscriptionsStarter := make(subscriptionMap)
	for k, v := range testSubscriptions {
		testSubscriptionsStarter[k] = v
	}

	want = 0
	for k, _ := range testSubscriptionsStarter {
		if strings.Split(k, "_")[1] == "enterprise" {
			delete(testSubscriptionsStarter, k)
		}
		if strings.Split(k, "_")[1] == "starter" {
			want++
		}
	}

	got = len(*testSubscriptionsStarter.findBestTier())
	if want != got {
		t.Errorf("Case: starter: Expected %d subscriptions, got %d", want, got)
	}

	want = 0
	for k, _ := range testSubscriptions {
		if strings.Split(k, "_")[1] == "MadeUpTier" {
			want++
		}
	}
	got = len(*testSubscriptions.findTier("MadeUpTier").findBestTier())
	if want != got {
		t.Errorf("Case: MadeUpTier: Expected %d subscriptions, got %d", want, got)
	}
}

func TestNewest(t *testing.T) {
	want := testSubscriptions["tectonic_starter_valid_newest"]
	got := testSubscriptions.findTectonic().unexpired(now).newest()
	eq := reflect.DeepEqual(want, *got)
	if !eq {
		t.Errorf("Expected %v, got %v", &want, got)
	}
}

func TestVerify(t *testing.T) {
	allExpired := make(subscriptionMap)
	for k, v := range testSubscriptions {
		if isExpired(v, now) {
			allExpired[k] = v
		}
	}
	expiredEnterprise := make(subscriptionMap)
	for k, v := range testSubscriptions {
		if k != "tectonic_enterprise_valid" {
			expiredEnterprise[k] = v
		}
	}
	cases := []struct {
		name          string
		subscriptions *subscriptionMap
		tier          string
		expiration    time.Time
	}{
		{"all", &testSubscriptions, "tectonic-enterprise", testSubscriptions["tectonic_enterprise_valid"].ServiceEnd},
		{"only-starter", testSubscriptions.findTier("starter"), "tectonic-starter", testSubscriptions["tectonic_starter_valid_newest"].ServiceEnd},
		{"all-expired", &allExpired, "tectonic-enterprise", allExpired["tectonic_enterprise_expired_early"].ServiceEnd},
		{"expired-enterprise", &expiredEnterprise, "tectonic-starter", testSubscriptions["tectonic_starter_valid_newest"].ServiceEnd},
	}

	for _, c := range cases {
		jwt, key, err := generateLicenseAndKey(c.subscriptions)
		if err != nil {
			t.Errorf("%v", err)
		}

		tier, expiration := Verify(key, jwt, now)
		if tier != c.tier {
			t.Errorf("Case %s: Expected %s; got %s", c.name, c.tier, tier)
		}
		if expiration != c.expiration {
			t.Errorf("Case %s: Expected %s; got %s", c.name, c.expiration, expiration)
		}
	}
}

func generateLicenseAndKey(s *subscriptionMap) (jwt io.Reader, key io.Reader, err error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 1024)
	if err != nil {
		return nil, nil, err
	}
	privateKeyDer := x509.MarshalPKCS1PrivateKey(privateKey)
	privateKeyBlock := pem.Block{
		Type:    "RSA PRIVATE KEY",
		Headers: nil,
		Bytes:   privateKeyDer,
	}
	privateKeyPem := string(pem.EncodeToMemory(&privateKeyBlock))
	publicKey := privateKey.PublicKey
	publicKeyDer, err := x509.MarshalPKIXPublicKey(&publicKey)
	if err != nil {
		return nil, nil, err
	}
	publicKeyBlock := pem.Block{
		Type:    "PUBLIC KEY",
		Headers: nil,
		Bytes:   publicKeyDer,
	}
	publicKeyPem := string(pem.EncodeToMemory(&publicKeyBlock))
	private := strings.NewReader(privateKeyPem)
	key = strings.NewReader(publicKeyPem)
	l := licenseReader.License{
		SchemaVersion:  "v2",
		Version:        "3",
		AccountID:      "test",
		AccountSecret:  "test",
		CreationDate:   now,
		ExpirationDate: now.Add(hour),
		Subscriptions:  *s,
	}
	raw, err := json.Marshal(l)
	if err != nil {
		return nil, nil, err
	}
	signer, err := joseutil.NewSigner(private, "tectonic-enterprise")
	if err != nil {
		return nil, nil, err
	}
	j, err := licenseReader.NewSignedLicense(signer, l.SchemaVersion, l.CreationDate, l.ExpirationDate, raw)
	if err != nil {
		return nil, nil, err
	}
	jwt = strings.NewReader(j)
	return jwt, key, nil
}
