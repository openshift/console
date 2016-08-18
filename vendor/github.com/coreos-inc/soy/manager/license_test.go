package manager

import (
	"io/ioutil"
	"testing"

	"github.com/coreos-inc/soy/common"
	"github.com/coreos-inc/soy/common/license"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/repo"
	"github.com/coreos-inc/soy/testutil"
	"github.com/coreos/go-oidc/jose"
	"github.com/jonboulle/clockwork"
)

func TestGetLicenseAssets(t *testing.T) {
	testutil.WithTestConn(t, func(tx db.Queryer) {
		clock := clockwork.NewFakeClock()
		now := clock.Now()

		privateKeyBytes, err := ioutil.ReadFile("../static/fake-license-signing-key.key")
		if err != nil {
			t.Fatal(err)
		}
		privateKey, err := common.ParseRSAPrivateKeyFromPEM(privateKeyBytes)
		if err != nil {
			t.Fatal(err)
		}

		signer := jose.NewSignerRSA("test", *privateKey)
		verifier := &signer.VerifierRSA
		accountID := "test-account-id"

		err = repo.CreateBFAccount(tx, accountID)
		if err != nil {
			t.Fatalf("unable to create test bf account: %v", err)
		}

		err = repo.CreateNewLicense(tx,
			accountID,
			now, now.AddDate(0, 1, 0),
			map[string]license.SubscriptionDef{
				"sub123": {
					PlanName:       "test-plan",
					PlanID:         "123",
					ProductName:    "test-product",
					ProductID:      "456",
					ServiceStart:   now,
					ServiceEnd:     now,
					Duration:       1,
					DurationPeriod: "days",
					Entitlements: map[string]int64{
						"builders": 1,
					},
				},
			},
		)
		if err != nil {
			t.Fatalf("unable to create license: %v", err)
		}

		asset, err := GetLicenseAssets(tx, signer, accountID)
		if err != nil {
			t.Fatal(err)
		}

		verified, err := license.VerifyLicense(verifier, asset.Formats["raw"].Value)
		if err != nil {
			t.Fatalf("error verifying license: %s", err)
		}
		if !verified {
			t.Fatal("expected license to verify, but it didnt")
		}
	})
}
