package joseutil

import (
	"crypto"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"io"
	"io/ioutil"
	"log"

	"github.com/coreos/go-oidc/jose"
)

var (
	ErrKeyMustBePEMEncoded = errors.New("Invalid Key: Key must be PEM encoded PKCS1 or PKCS8 private/public key")
	ErrNotRSAPublicKey     = errors.New("Key is not a valid RSA public key")
	ErrNotRSAPrivateKey    = errors.New("Key is not a valid RSA private key")
)

func NewSigner(reader io.Reader, keyID string) (*jose.SignerRSA, error) {
	keyContents, err := ioutil.ReadAll(reader)
	if err != nil {
		return nil, err
	}

	rsaPrivate, err := ParseRSAPrivateKeyFromPEM(keyContents)
	if err != nil {
		log.Fatal(err)
	}
	return jose.NewSignerRSA(keyID, *rsaPrivate), nil
}

func NewVerifier(reader io.Reader, keyID string) (*jose.VerifierRSA, error) {
	keyContents, err := ioutil.ReadAll(reader)
	if err != nil {
		return nil, err
	}

	rsaPub, err := ParseRSAPublicKeyFromPEM(keyContents)
	if err != nil {
		return nil, err
	}

	return &jose.VerifierRSA{
		KeyID:     keyID,
		Hash:      crypto.SHA256,
		PublicKey: *rsaPub,
	}, nil
}

// Parse PEM encoded PKCS1 or PKCS8 private key
func ParseRSAPrivateKeyFromPEM(key []byte) (*rsa.PrivateKey, error) {
	var err error

	// Parse PEM block
	var block *pem.Block
	if block, _ = pem.Decode(key); block == nil {
		return nil, ErrKeyMustBePEMEncoded
	}

	var parsedKey interface{}
	if parsedKey, err = x509.ParsePKCS1PrivateKey(block.Bytes); err != nil {
		if parsedKey, err = x509.ParsePKCS8PrivateKey(block.Bytes); err != nil {
			return nil, err
		}
	}

	var pkey *rsa.PrivateKey
	var ok bool
	if pkey, ok = parsedKey.(*rsa.PrivateKey); !ok {
		return nil, ErrNotRSAPrivateKey
	}

	return pkey, nil
}

// Parse PEM encoded PKCS1 or PKCS8 public key
func ParseRSAPublicKeyFromPEM(key []byte) (*rsa.PublicKey, error) {
	var err error

	// Parse PEM block
	var block *pem.Block
	if block, _ = pem.Decode(key); block == nil {
		return nil, ErrKeyMustBePEMEncoded
	}

	// Parse the key
	var parsedKey interface{}
	if parsedKey, err = x509.ParsePKIXPublicKey(block.Bytes); err != nil {
		if cert, err := x509.ParseCertificate(block.Bytes); err == nil {
			parsedKey = cert.PublicKey
		} else {
			return nil, err
		}
	}

	var pkey *rsa.PublicKey
	var ok bool
	if pkey, ok = parsedKey.(*rsa.PublicKey); !ok {
		return nil, ErrNotRSAPublicKey
	}

	return pkey, nil
}
