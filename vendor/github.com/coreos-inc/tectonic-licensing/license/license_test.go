package license

import (
	"crypto/rand"
	"crypto/rsa"
	"fmt"
	"io/ioutil"
	"testing"
	"time"
)

func TestLicense(t *testing.T) {
	now := time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)
	accountID := "myfakeaccount"
	subs := map[string]Subscription{
		"123": {
			PlanName: "test-plan",
		},
	}

	publicKeyBytes, err := ioutil.ReadFile("fake-license-signing-key.pub")
	if err != nil {
		t.Fatalf("unable to open public key file: %v", err)
	}

	privateKeyBytes, err := ioutil.ReadFile("fake-license-signing-key.key")
	if err != nil {
		t.Fatalf("unable to open private key file: %v", err)
	}

	privateKeyI, err := LoadPrivateKey(privateKeyBytes)
	if err != nil {
		t.Fatalf("unable to load private key: %v", err)
	}
	privateKey := privateKeyI.(*rsa.PrivateKey)

	publicKeyI, err := LoadPublicKey(publicKeyBytes)
	if err != nil {
		t.Fatalf("unable to load public key: %v", err)
	}
	publicKey := publicKeyI.(*rsa.PublicKey)

	extraPrivateKey, err := rsa.GenerateKey(rand.Reader, 1024)
	if err != nil {
		t.Fatalf("unable to generate private key: %v", err)
	}

	tests := []struct {
		expired        bool
		valid          bool
		currentTime    time.Time
		expirationDate time.Time
		privateKey     *rsa.PrivateKey
	}{
		{
			expired:        false,
			valid:          true,
			privateKey:     privateKey,
			expirationDate: now.AddDate(1, 0, 0), // Expiration 1 year from the current time
		},
		{
			expired:        false,
			valid:          true,
			privateKey:     privateKey,
			expirationDate: now,
		},
		{
			expired:        true,
			valid:          true,
			privateKey:     privateKey,
			expirationDate: now.Add(-time.Microsecond), // Expired just now
		},
		{
			expired:        true,
			valid:          true,
			privateKey:     privateKey,
			expirationDate: now.AddDate(-1, 0, 0), // Expired a year ago
		},
		{
			expired:        false,
			valid:          true,
			privateKey:     privateKey,
			expirationDate: now.AddDate(1, 0, 0), // Expiration 1 year from the current time
		},
		{
			expired:        false,
			valid:          false,
			privateKey:     extraPrivateKey,
			expirationDate: now.AddDate(1, 0, 0), // Expiration 1 year from the current time
		},
	}

	for _, tt := range tests {
		testName := fmt.Sprintf("Decode:expired=%t,valid=%t,expirationRelative=%s", tt.expired, tt.valid, tt.expirationDate.Sub(now))
		t.Run(testName, func(t *testing.T) {
			l := New(accountID, now, tt.expirationDate, subs)
			// Generally the license is always accessed after it's been encoded, so
			// we do an encode/decode dance for testing
			licenseRaw, err := Encode(tt.privateKey, l)
			if err != nil {
				t.Fatalf("unable to encode license: %v", err)
			}

			l, err = Decode(publicKey, licenseRaw)
			if tt.valid && err != nil {
				t.Fatalf("unable to decode license: %v", err)
			} else if !tt.valid && err != ErrInvalidLicense {
				t.Fatalf("expected invalid license (err=%v), got err=%v", ErrInvalidLicense, err)
			}

			if !tt.valid {
				return
			}

			expired := l.Expired(now)
			if expired != tt.expired {
				t.Errorf("expected license expired=%t, got expired=%t, expirationDate: %s, now: %s", tt.expired, expired, l.ExpirationDate, now)
			}
		})

	}
}

func TestLicenseFromFile(t *testing.T) {
	publicKeyBytes, err := ioutil.ReadFile("test-signing-key.pub")
	if err != nil {
		t.Fatalf("unable to open public key file: %v", err)
	}

	publicKeyI, err := LoadPublicKey(publicKeyBytes)
	if err != nil {
		t.Fatalf("unable to load public key: %v", err)
	}
	publicKey := publicKeyI.(*rsa.PublicKey)

	licenseBytes, err := ioutil.ReadFile("test-license.txt")
	if err != nil {
		t.Fatalf("unable to open license file: %v", err)
	}

	licenseRaw := string(licenseBytes)

	_, err = Decode(publicKey, licenseRaw)
	if err != nil {
		t.Fatalf("unable to decode license, expected to decode license, err: %v", err)
	}
}
