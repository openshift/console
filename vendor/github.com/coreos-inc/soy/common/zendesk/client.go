package zendesk

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
)

type Credentials struct {
	Domain string
	Email  string
	Token  string
}

func (creds *Credentials) Valid() error {
	if creds.Domain == "" {
		return fmt.Errorf("domain empty")
	}
	if creds.Email == "" {
		return fmt.Errorf("email empty")
	}
	if creds.Token == "" {
		return fmt.Errorf("token empty")
	}
	return nil
}

type Client struct {
	Credentials Credentials
}

func (c *Client) OrganizationAPI() OrganizationAPI {
	return &httpOrganizationAPI{client: c}
}

func (c *Client) UserAPI() UserAPI {
	return &httpUserAPI{client: c}
}

func (c *Client) baseURL() url.URL {
	return url.URL{Scheme: "https", Host: fmt.Sprintf("%s.zendesk.com", c.Credentials.Domain), Path: "/"}
}

func (c *Client) Do(req *http.Request) (*http.Response, error) {
	req.SetBasicAuth(fmt.Sprintf("%s/token", c.Credentials.Email), c.Credentials.Token)
	return http.DefaultClient.Do(req)
}

type ApiError struct {
	Details map[string][]struct {
		Description string `json:"description"`
		Error       string `json:"error"`
	} `json:"details"`
	Description string `json:"description"`
	ErrorType   string `json:"error"`
}

func (e ApiError) Error() string {
	msg := fmt.Sprintf("Error: %s, Details: %+v", e.ErrorType, e.Details)
	if e.Description != "" {
		msg += " Description: " + e.Description
	}
	return msg
}

func checkForAPIError(res *http.Response) error {
	if res.StatusCode == http.StatusOK || res.StatusCode == http.StatusCreated {
		return nil
	}

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return err
	}
	// Api Errors are in the 400's, anything else is still an error, but
	// just not this specific type of error
	if res.StatusCode >= 400 && res.StatusCode < 500 {
		var apiErr ApiError
		err = json.Unmarshal(body, &apiErr)
		if err != nil {
			return err
		}
		return apiErr
	}
	return fmt.Errorf("unexpected HTTP response: code: %d body: %s", res.StatusCode, string(body))
}
