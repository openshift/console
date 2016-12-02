package verify

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"testing"
	"time"

	"github.com/coreos-inc/tectonic-licensing/license"
)

var (
	now  time.Time     = time.Now().UTC()
	hour time.Duration = time.Hour
	day  time.Duration = 24 * time.Hour
)

func TestVerify(t *testing.T) {
	accountID := "myfakeaccount"

	tests := []struct {
		name                     string
		validLicense             bool
		expectedEntitlementKind  string
		expectedEntitlementCount int64
		expirationDate           time.Time
		perSubEntitlements       []map[string]int64
	}{
		{
			name:                     "valid, unexpired license (sockets)",
			validLicense:             true,
			expirationDate:           now.Add(10 * hour),
			expectedEntitlementKind:  "sockets",
			expectedEntitlementCount: 50,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic-2016-12.socket-pair": 25},
			},
		},
		{
			name:                     "valid, unexpired license (vCPUs)",
			validLicense:             true,
			expirationDate:           now.Add(10 * hour),
			expectedEntitlementKind:  "vCPUs",
			expectedEntitlementCount: 10,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic-2016-12.vcpu-pair": 5},
			},
		},
		{
			name:                     "valid, unexpired license (nodes)",
			validLicense:             true,
			expirationDate:           now.Add(10 * hour),
			expectedEntitlementKind:  "nodes",
			expectedEntitlementCount: 10,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic-2016-12.free-node-count": 10},
			},
		},
		{
			name:                     "valid, unexpired license (enterprise)",
			validLicense:             true,
			expirationDate:           now.Add(10 * hour),
			expectedEntitlementKind:  "",
			expectedEntitlementCount: 0,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic": 1},
			},
		},
		{
			name:                     "valid, unexpired license (enterprise + everything)",
			validLicense:             true,
			expirationDate:           now.Add(10 * hour),
			expectedEntitlementKind:  "",
			expectedEntitlementCount: 0,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic-2016-12.free-node-count": 99},
				{"software.tectonic-2016-12.vcpu-pair": 11},
				{"software.tectonic": 1},
				{"software.tectonic-2016-12.socket-pair": 25},
			},
		},
		{
			name:                     "valid, expired license (< 30 days ago)",
			validLicense:             true,
			expirationDate:           now.Add(-29 * day),
			expectedEntitlementKind:  "",
			expectedEntitlementCount: 0,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic-2016-12.socket-pair": 25},
			},
		},
		{
			name:                     "valid, expired license (> 30 days ago)",
			validLicense:             true,
			expirationDate:           now.Add(-31 * day),
			expectedEntitlementKind:  "",
			expectedEntitlementCount: 0,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic-2016-12.socket-pair": 25},
			},
		},
		{
			name:                     "valid, expired license (enterprise)",
			validLicense:             true,
			expirationDate:           now.Add(-31 * day),
			expectedEntitlementKind:  "",
			expectedEntitlementCount: 0,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic": 1},
			},
		},
		{
			name:                     "invalid, unexpired license",
			validLicense:             false,
			expirationDate:           now.Add(10 * hour),
			expectedEntitlementKind:  "",
			expectedEntitlementCount: 0,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic-2016-12.socket-pair": 25},
			},
		},
		{
			name:                     "invalid, expired license",
			validLicense:             false,
			expirationDate:           now.Add(-10 * hour),
			expectedEntitlementKind:  "",
			expectedEntitlementCount: 0,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic-2016-12.socket-pair": 25},
			},
		},
		{
			name:                     "invalid, expired enterprise license",
			validLicense:             false,
			expirationDate:           now.Add(-10 * hour),
			expectedEntitlementKind:  "",
			expectedEntitlementCount: 0,
			perSubEntitlements: []map[string]int64{
				{"software.tectonic-2016-12": 1},
				{"software.tectonic": 1},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			subs := make(map[string]license.Subscription)
			for i, entitlements := range tt.perSubEntitlements {
				subName := fmt.Sprintf("SUB-%d", i)
				subs[subName] = license.Subscription{
					Entitlements: entitlements,
					ServiceStart: tt.expirationDate.Add(-60 * day),
					ServiceEnd:   tt.expirationDate,
				}
			}

			l := license.New(accountID, tt.expirationDate.Add(-60*day), tt.expirationDate, subs)
			licenseString, key, err := generateLicenseAndKey(l)
			if err != nil {
				t.Errorf("%v", err)
			}

			expectedExpirationDate := tt.expirationDate
			expectedGraceExpirationDate := tt.expirationDate.Add(30 * day)
			if !tt.validLicense {
				key = "wrong public key"
				var defaultTime time.Time
				expectedExpirationDate = defaultTime
				expectedGraceExpirationDate = defaultTime
			}

			expiration, graceExpiration, entitlementKind, entitlementCount, licenseError := Verify(key, licenseString, now)
			if tt.validLicense && licenseError != nil {
				t.Errorf("expected no error for valid license, got error=%v", licenseError)
			}
			if !tt.validLicense && licenseError == nil {
				t.Errorf("expected error for invalid license, got error=nil")
			}
			if expiration != expectedExpirationDate {
				t.Errorf("expected expiration of=%s, got expiration=%s", expectedExpirationDate, expiration)
			}
			if graceExpiration != expectedGraceExpirationDate {
				t.Errorf("expected graceExpiration of=%s, got graceExpiration=%s", expectedGraceExpirationDate, graceExpiration)
			}
			if entitlementKind != tt.expectedEntitlementKind {
				t.Errorf("expected entitlementKind of=%s, got entitlementKind=%s", tt.expectedEntitlementKind, entitlementKind)
			}
			if entitlementCount != tt.expectedEntitlementCount {
				t.Errorf("expected entitlementCount of=%d, got entitlementCount=%d", tt.expectedEntitlementCount, entitlementCount)
			}
		})
	}
}

func generateLicenseAndKey(l *license.License) (licenseString, key string, err error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 1024)
	if err != nil {
		return "", "", err
	}
	publicKey := privateKey.PublicKey
	publicKeyDer, err := x509.MarshalPKIXPublicKey(&publicKey)
	if err != nil {
		return "", "", err
	}
	publicKeyBlock := pem.Block{
		Type:    "PUBLIC KEY",
		Headers: nil,
		Bytes:   publicKeyDer,
	}
	publicKeyPem := string(pem.EncodeToMemory(&publicKeyBlock))
	j, err := license.Encode(privateKey, l)
	if err != nil {
		return "", "", err
	}
	return j, publicKeyPem, nil
}
