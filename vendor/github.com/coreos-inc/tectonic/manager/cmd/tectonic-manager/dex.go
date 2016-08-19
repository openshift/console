package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"

	"github.com/coreos/dex/schema/adminschema"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/googleapi"
)

func newDexAdminAPIClient(endpoint, token string) (*adminschema.Service, error) {
	hClient := newAuthenticatedHTTPClient(token)
	return adminschema.NewWithBasePath(hClient, endpoint)
}

func newAuthenticatedHTTPClient(token string) *http.Client {
	return &http.Client{
		Transport: &adminAPITransport{
			secret: token,
		},
	}
}

type adminAPITransport struct {
	secret string
}

func (a *adminAPITransport) RoundTrip(r *http.Request) (*http.Response, error) {
	r.Header.Set("Authorization", a.secret)
	return http.DefaultTransport.RoundTrip(r)
}

func createDexClient(overlordURL, apiKey string, client *adminschema.Client) (*adminschema.Client, error) {
	adminClient, err := newDexAdminAPIClient(overlordURL, apiKey)
	if err != nil {
		return nil, err
	}

	resp, err := adminClient.Client.Create(&adminschema.ClientCreateRequest{Client: client}).Do()
	if err != nil {
		return nil, err
	}

	return resp.Client, nil
}

type dexUser struct {
	Email            string
	Password         string
	GeneratePassword bool
}

func createAdminUser(overlordURL, apiKey string, user dexUser) (*adminschema.Admin, error) {
	password := user.Password
	if password == "" && user.GeneratePassword {
		logger.Println("generating random password")
		// Generate 16 random bytes and base64 the result.
		b := make([]byte, 16)
		if _, err := rand.Read(b); err != nil {
			return nil, fmt.Errorf("could not generate random bytes: %v", err)
		}
		password = base64.StdEncoding.EncodeToString(b)
	}

	// The admin API wants the hash of the password.
	pwHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	adminClient, err := newDexAdminAPIClient(overlordURL, apiKey)
	if err != nil {
		return nil, err
	}

	admin, err := adminClient.Admin.Create(&adminschema.Admin{
		Email:    user.Email,
		Password: string(pwHash),
	}).Do()
	if err != nil {
		return nil, err
	}
	return admin, nil
}

func dexErrAlreadyExists(err error) bool {
	gerr, ok := err.(*googleapi.Error)
	return ok && gerr.Code == http.StatusConflict
}
