package auth

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/coreos/go-oidc/jose"
	"github.com/coreos/go-oidc/oidc"
)

type nowFunc func() time.Time

func defaultNow() time.Time {
	return time.Now()
}

func maxAge(exp time.Time, curr time.Time) int {
	age := exp.Sub(curr)
	return int(age.Seconds())
}

// token is an interface around JWTs for testing
type token interface {
	Claims() (jose.Claims, error)
	Encode() string
}

// tokenVerifier funcs parse and verify an encoded token into an actual token object.
type tokenVerifier func(string) (token, error)

func jwtVerifier(oidcClient *oidc.Client) tokenVerifier {
	return func(encodedToken string) (token, error) {
		jwt, err := jose.ParseJWT(encodedToken)
		if err != nil {
			return nil, err
		}

		if err = oidcClient.VerifyJWT(jwt); err != nil {
			return nil, err
		}

		return &jwt, nil
	}
}

func randomString(length int) string {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		panic(fmt.Sprintf("FATAL ERROR: Unable to get random bytes for session token: %v", err))
	}
	return base64.StdEncoding.EncodeToString(bytes)
}
