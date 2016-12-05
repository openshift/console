package teckubelicense

import (
	"crypto/rsa"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"testing"
	"time"

	"github.com/coreos-inc/tectonic-licensing/license"
)

func TestGetLicenseDetails(t *testing.T) {
	accountID := "myfakeaccount"

	now := time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)
	licenseCreationDate := now.AddDate(0, 0, -1)  // created 1 day before "now"
	licenseExpirationDate := now.AddDate(1, 0, 0) // expires in 1 year

	expiredSubServiceStart := now.AddDate(-1, 0, -10)               // started 1 year 10 days ago
	expiredSubServiceEnd := expiredSubServiceStart.AddDate(1, 0, 0) // ended 10 days ago

	inactiveSubServiceStart := now.AddDate(0, 1, 0) // starts in a month
	activeSubServiceStart := now.AddDate(0, 0, -5)  // started 5 days ago
	activeSubServiceEnd := now.AddDate(0, 6, 0)     // ends in 6 months

	type subscriptionInput struct {
		ServiceStart time.Time
		ServiceEnd   time.Time
		Entitlements map[string]int64
	}

	newSubInput := func(subState string, entitlements map[string]int64) subscriptionInput {
		var serviceStart, serviceEnd time.Time
		switch subState {
		case "active":
			serviceStart, serviceEnd = activeSubServiceStart, activeSubServiceEnd
		case "inactive":
			serviceStart, serviceEnd = inactiveSubServiceStart, activeSubServiceEnd
		case "expired":
			serviceStart, serviceEnd = expiredSubServiceStart, expiredSubServiceEnd
		default:
			t.Fatalf("unexpected subscription state")
		}
		return subscriptionInput{
			ServiceStart: serviceStart,
			ServiceEnd:   serviceEnd,
			Entitlements: entitlements,
		}
	}

	tests := []struct {
		expectedGetEnforcementErr error
		expectedBypassEnforcement bool
		expectedEntitlementKind   string
		expectedEntitlementCount  int64
		subscriptionInputs        []subscriptionInput
	}{
		{
			// all entitlements with sockets being preferred
			expectedEntitlementKind:  "sockets",
			expectedEntitlementCount: 50,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 99,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 11,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 25,
				}),
			},
		},
		{
			// all entitlements, each multiple times with sockets being preferred
			expectedEntitlementKind:  "sockets",
			expectedEntitlementCount: 50,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 10,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 10,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 20,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 10,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 10,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 15,
				}),
			},
		},
		{
			// all entitlements with sockets being smallest, but preferred still
			expectedEntitlementKind:  "sockets",
			expectedEntitlementCount: 2,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 99,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 6,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 1,
				}),
			},
		},
		{
			// socket entitlement alone
			expectedEntitlementKind:  "sockets",
			expectedEntitlementCount: 8,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 4,
				}),
			},
		},
		{
			// socket entitlement multiple times
			expectedEntitlementKind:  "sockets",
			expectedEntitlementCount: 10,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 2,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 3,
				}),
			},
		},
		{
			// vcpus take precedence over nodes
			expectedEntitlementKind:  "vCPUs",
			expectedEntitlementCount: 10,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 99,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 5,
				}),
			},
		},
		{
			// vcpus alone
			expectedEntitlementKind:  "vCPUs",
			expectedEntitlementCount: 8,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 4,
				}),
			},
		},
		{
			// mutliple subscriptions with vcpus
			expectedEntitlementKind:  "vCPUs",
			expectedEntitlementCount: 10,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 2,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 3,
				}),
			},
		},
		{
			// nodes alone
			expectedEntitlementKind:  "nodes",
			expectedEntitlementCount: 10,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 10,
				}),
			},
		},
		{
			// multiple free tier subscriptions, we only count the largest of
			// them. We do not sum the node counts.
			expectedEntitlementKind:  "nodes",
			expectedEntitlementCount: 25,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 10,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 25,
				}),
			},
		},
		{
			// all entitlements including the legacy tectonic-enterprise
			// software entitlement, no enforcement
			expectedBypassEnforcement: true,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 99,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 11,
				}),
				// Legacy tectonic
				newSubInput("active", map[string]int64{
					"software.tectonic": 1,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 25,
				}),
			},
		},
		{
			// expired tectonic legacy subscription with a vcpu license, the
			// vcpus should be used, and the legacy tectonic entitlement should
			// be ignored
			expectedBypassEnforcement: false,
			expectedEntitlementKind:   "vCPUs",
			expectedEntitlementCount:  8,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 4,
				}),
				// Legacy tectonic
				newSubInput("expired", map[string]int64{
					"software.tectonic": 1,
				}),
			},
		},
		{
			// all entitlements, but all subs expired
			expectedGetEnforcementErr: ErrNoActiveSubscriptions,
			subscriptionInputs: []subscriptionInput{
				newSubInput("expired", map[string]int64{
					"software.tectonic-2016-12":                 1,
					"software.tectonic-2016-12.free-node-count": 99,
				}),
				newSubInput("expired", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 11,
				}),
				newSubInput("expired", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 25,
				}),
				// Legacy tectonic
				newSubInput("expired", map[string]int64{
					"software.tectonic": 1,
				}),
			},
		},
		{
			// both vcpus and sockets, with the socket subscription not active
			// so vcpus should be all that is left, and the count should
			// only be for the one active subscription
			expectedEntitlementKind:  "vCPUs",
			expectedEntitlementCount: 22,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 11,
				}),
				newSubInput("inactive", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 5,
				}),
				newSubInput("inactive", map[string]int64{
					"software.tectonic-2016-12":             1,
					"software.tectonic-2016-12.socket-pair": 25,
				}),
			},
		},
		{
			// Disable enforcement causes bypass enforcement.
			expectedBypassEnforcement: true,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12.disable-enforcement": 1,
				}),
			},
		},
		{
			// Disable enforcement is expired, just return the next sub.
			expectedEntitlementKind:  "vCPUs",
			expectedEntitlementCount: 22,
			subscriptionInputs: []subscriptionInput{
				newSubInput("expired", map[string]int64{
					"software.tectonic-2016-12.disable-enforcement": 1,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 11,
				}),
			},
		},
		{
			// Disable enforcement wins out over all other subs.
			expectedBypassEnforcement: true,
			subscriptionInputs: []subscriptionInput{
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12":           1,
					"software.tectonic-2016-12.vcpu-pair": 11,
				}),
				newSubInput("active", map[string]int64{
					"software.tectonic-2016-12.disable-enforcement": 1,
				}),
			},
		},
	}
	for _, tt := range tests {
		testName := fmt.Sprintf("GetLicenseDetails:expectedEntitlementKind=%s,expectedEntitlementCount=%d,expectedErr=%v", tt.expectedEntitlementKind, tt.expectedEntitlementCount, tt.expectedGetEnforcementErr)
		t.Run(testName, func(t *testing.T) {

			subs := make(map[string]license.Subscription)
			for i, input := range tt.subscriptionInputs {
				subName := fmt.Sprintf("SUB-%d", i)
				subs[subName] = license.Subscription{
					Entitlements: input.Entitlements,
					ServiceStart: input.ServiceStart,
					ServiceEnd:   input.ServiceEnd,
				}
			}

			lic := license.New(accountID, licenseCreationDate, licenseExpirationDate, subs)
			details := GetLicenseDetails(lic, now)

			bypass := details.BypassEnforcement()
			if bypass != tt.expectedBypassEnforcement {
				t.Errorf("expected bypassEnforcement=%t, got bypassEnforcement=%v", tt.expectedBypassEnforcement, bypass)
			}

			kind, count, enforce, err := GetEnforcementKindAndCount(details, now)
			if err != nil {
				expectedErr := tt.expectedGetEnforcementErr
				if bypass {
					expectedErr = ErrNoEnforcement
				}
				if err != expectedErr {
					t.Fatalf("expected GetLicenseDetails() err=%v: got err=%v", tt.expectedGetEnforcementErr, err)
				}
				return
			}

			if enforce {
				if kind == "" || count == 0 {
					t.Fatalf("did not find any entitlements")
				}

				if kind != tt.expectedEntitlementKind {
					t.Errorf("expected entitlement kind=%s, got kind=%s", tt.expectedEntitlementKind, kind)
				}

				if count != tt.expectedEntitlementCount {
					t.Errorf("expected entitlement count=%d, got count=%d", tt.expectedEntitlementCount, count)
				}
			}
		})
	}
}

func TestGetLicenseDetailsFromFile(t *testing.T) {

	fixturesDir := "../fixtures"
	tests := []struct {
		publicKey                 string
		file                      string
		expectedBypassEnforcement bool
		expectedEntitlementKind   string
		expectedEntitlementCount  int64
	}{
		// We expect this to bypsas enforcement because this is a license
		// containing Tectonic Enterprise, a subscription sold prior to
		// enforcement being enabled in the product.
		{
			publicKey: license.StagingSigningPublicKey,
			file:      "./free-and-legacy-tectonic-bypass-enforcement-license-staging.txt",
			expectedBypassEnforcement: true,
		},
		// Same as above but with a production
		{
			publicKey: license.ProductionSigningPublicKey,
			file:      "legacy-tectonic-and-others-bypass-enforcement-license-production.txt",
			expectedBypassEnforcement: true,
		},
		{
			publicKey: license.StagingSigningPublicKey,
			file:      "./free-and-virt-22-vcpu-pairs-license-staging.txt",
			expectedEntitlementKind:  "vCPUs",
			expectedEntitlementCount: 44,
		},
		{
			publicKey: license.StagingSigningPublicKey,
			file:      "./free-and-virt-and-physical-10-socket-pairs-license-staging.txt",
			expectedEntitlementKind:  "sockets",
			expectedEntitlementCount: 20,
		},
		{
			publicKey: license.StagingSigningPublicKey,
			file:      "./free-only-10-nodes-license-staging.txt",
			expectedEntitlementKind:  "nodes",
			expectedEntitlementCount: 10,
		},
		{
			publicKey: license.StagingSigningPublicKey,
			file:      "legacy-tectonic-only-bypass-enforcement-license-staging.txt",
			expectedBypassEnforcement: true,
		},
	}

	// The licenses above were created on December 1st, 2016, so 1 day after
	// and these should be active. This has to be fixed, or the licenses will
	// be expired sometime in the future
	now := time.Date(2016, time.December, 2, 0, 0, 0, 0, time.UTC)

	for _, tt := range tests {
		licenseFile := filepath.Join(fixturesDir, tt.file)
		testName := fmt.Sprintf("GetLicenseDetailsFromFile:file=%s", licenseFile)
		t.Run(testName, func(t *testing.T) {
			t.Logf("Validating %s license", licenseFile)

			key, err := license.LoadPublicKey([]byte(tt.publicKey))
			if err != nil {
				t.Fatalf("unable to load public key: %v", err)
			}
			publicKey := key.(*rsa.PublicKey)

			contents, err := ioutil.ReadFile(licenseFile)
			if err != nil {
				t.Fatalf("unable to read license file %s, err: %v", licenseFile, err)
			}

			lic, err := license.Decode(publicKey, string(contents))
			if err != nil {
				t.Fatalf("unable to deocde license %s, err: %v", licenseFile, err)
			}
			details := GetLicenseDetails(lic, now)
			bypass := details.BypassEnforcement()

			if tt.expectedBypassEnforcement != bypass {
				t.Errorf("expected bypass enforcement=%v, got bypass enforcement=%v", tt.expectedBypassEnforcement, bypass)
			}

			if tt.expectedBypassEnforcement || bypass {
				return
			}

			kind, count, enforce, err := GetEnforcementKindAndCount(details, now)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if enforce {
				if kind == "" || count == 0 {
					t.Fatalf("did not find any entitlements")
				}

				if kind != tt.expectedEntitlementKind {
					t.Errorf("expected entitlement kind=%s, got kind=%s", tt.expectedEntitlementKind, kind)
				}

				if count != tt.expectedEntitlementCount {
					t.Errorf("expected entitlement count=%d, got count=%d", tt.expectedEntitlementCount, count)
				}
			}

		})

	}
}
