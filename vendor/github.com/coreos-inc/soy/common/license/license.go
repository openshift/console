package license

import (
	"encoding/json"
	"time"

	"github.com/coreos/go-oidc/jose"
)

const LicenseSchemaVersion = "v2"

type License struct {
	SchemaVersion  string                     `json:"schemaVersion"`
	Version        string                     `json:"version"`
	AccountID      string                     `json:"accountID"`
	AccountSecret  string                     `json:"accountSecret"`
	CreationDate   time.Time                  `json:"creationDate"`
	ExpirationDate time.Time                  `json:"expirationDate"`
	Subscriptions  map[string]SubscriptionDef `json:"subscriptions"`
}

type SubscriptionDef struct {
	PlanName       string           `json:"planName"`
	PlanID         string           `json:"planID"`
	ProductName    string           `json:"productName"`
	ProductID      string           `json:"productID"`
	ServiceStart   time.Time        `json:"serviceStart"`
	ServiceEnd     time.Time        `json:"serviceEnd"`
	Duration       int32            `json:"duration"`
	DurationPeriod string           `json:"durationPeriod"`
	Entitlements   map[string]int64 `json:"entitlements"`
}

func NewSignedLicense(signer jose.Signer, schemaVersion string, creationDate, expirationDate time.Time, rawLicense []byte) (string, error) {
	claims := make(jose.Claims)
	claims.Add("schemaVersion", schemaVersion)
	claims.Add("creationDate", creationDate.UTC().String())
	claims.Add("expirationDate", expirationDate.UTC().String())
	claims.Add("license", string(rawLicense))
	jwt, err := jose.NewSignedJWT(claims, signer)
	if err != nil {
		return "", err
	}
	return jwt.Encode(), nil
}

func NewLicenseFromJWT(jwt jose.JWT) (*License, error) {
	claims, err := jwt.Claims()
	if err != nil {
		return nil, err
	}
	strLicense, _, err := claims.StringClaim("license")
	if err != nil {
		return nil, err
	}
	var l License
	err = json.Unmarshal([]byte(strLicense), &l)
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func VerifyJWT(verifier jose.Verifier, jwt jose.JWT) (bool, error) {
	err := verifier.Verify(jwt.Signature, []byte(jwt.Data()))
	if err != nil {
		return false, err
	}
	return true, nil
}

func VerifyLicense(verifier jose.Verifier, data string) (bool, error) {
	jwt, err := jose.ParseJWT(data)
	if err != nil {
		return false, err
	}
	return VerifyJWT(verifier, jwt)
}
