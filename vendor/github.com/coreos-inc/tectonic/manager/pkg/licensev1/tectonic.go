package licensev1

import "github.com/coreos/go-oidc/jose"

const (
	accountSecretLength    = 32
	tectonicLicenseVersion = "1"
)

type TectonicEnterpriseLicense struct {
	Version         string `json:"version"`
	AccountID       string `json:"account_id"`
	ProductID       string `json:"product_id"`
	SkuID           string `json:"sku_id"`
	PurchaseDate    string `json:"purchase_date"`
	PurchasePeriod  string `json:"purchase_period"`
	ReportingSecret string `json:"reporting_secret"`
}

func (license *TectonicEnterpriseLicense) ToJWT(signer jose.Signer) (*jose.JWT, error) {
	claims := map[string]interface{}{
		"version":         tectonicLicenseVersion,
		"accountID":       license.AccountID,
		"productID":       license.ProductID,
		"skuID":           license.SkuID,
		"purchaseDate":    license.PurchaseDate,
		"purchasePeriod":  license.PurchasePeriod,
		"reportingSecret": license.ReportingSecret,
	}
	jwt, err := jose.NewSignedJWT(claims, signer)
	if err != nil {
		return nil, err
	}
	return jwt, nil
}

func NewTectonicLicenseFromJWT(jwt jose.JWT) (*TectonicEnterpriseLicense, error) {
	claims, err := jwt.Claims()
	if err != nil {
		return nil, err
	}
	var newLicense TectonicEnterpriseLicense
	newLicense.Version, _, err = claims.StringClaim("version")
	if err != nil {
		return nil, err
	}
	newLicense.AccountID, _, err = claims.StringClaim("accountID")
	if err != nil {
		return nil, err
	}
	newLicense.ProductID, _, err = claims.StringClaim("productID")
	if err != nil {
		return nil, err
	}
	newLicense.SkuID, _, err = claims.StringClaim("skuID")
	if err != nil {
		return nil, err
	}
	newLicense.PurchaseDate, _, err = claims.StringClaim("purchaseDate")
	if err != nil {
		return nil, err
	}
	newLicense.PurchasePeriod, _, err = claims.StringClaim("purchasePeriod")
	if err != nil {
		return nil, err
	}
	newLicense.ReportingSecret, _, err = claims.StringClaim("reportingSecret")
	if err != nil {
		return nil, err
	}
	return &newLicense, nil
}
