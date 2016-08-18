package zendesk

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

type Organization struct {
	ID         int      `json:"id"`
	Name       string   `json:"name"`
	ExternalID string   `json:"external_id"`
	Tags       []string `json:"tags"`
}

type OrganizationAPI interface {
	ListByExternalID(string) ([]Organization, error)
	Create(Organization) (Organization, error)
	AddTags(int, []string) error
	RemoveTags(int, []string) error
}

type httpOrganizationAPI struct {
	client *Client
}

func (o *httpOrganizationAPI) ListByExternalID(externalID string) ([]Organization, error) {
	u := o.client.baseURL()
	u.Path = "/api/v2/organizations/show_many.json"
	v := u.Query()
	v.Set("external_ids", externalID)
	u.RawQuery = v.Encode()

	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed creating HTTP request: %v", err)
	}

	res, err := o.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %v", err)
	}
	defer res.Body.Close()

	err = checkForAPIError(res)
	if err != nil {
		return nil, err
	}

	var or organizationsResponse
	if err := json.NewDecoder(res.Body).Decode(&or); err != nil {
		return nil, fmt.Errorf("failed unmarshaling JSON response: %v", err)
	}

	return []Organization(or), nil
}

func (o *httpOrganizationAPI) Create(org Organization) (Organization, error) {
	cr := organizationCreateRequest(org)
	b, err := json.Marshal(&cr)
	if err != nil {
		return Organization{}, fmt.Errorf("failed marshaling JSON request: %v", err)
	}

	u := o.client.baseURL()
	u.Path = "/api/v2/organizations.json"

	req, err := http.NewRequest("POST", u.String(), bytes.NewReader(b))
	if err != nil {
		return Organization{}, fmt.Errorf("failed creating HTTP request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	res, err := o.client.Do(req)
	if err != nil {
		return Organization{}, fmt.Errorf("HTTP request failed: %v", err)
	}
	defer res.Body.Close()

	err = checkForAPIError(res)
	if err != nil {
		return Organization{}, err
	}

	var or organizationResponse
	if err := json.NewDecoder(res.Body).Decode(&or); err != nil {
		return Organization{}, fmt.Errorf("failed unmarshaling JSON response: %v", err)
	}

	return Organization(or), nil
}

func (o *httpOrganizationAPI) AddTags(id int, tags []string) error {
	return o.modifyTags(id, tags, "PUT")
}

func (o *httpOrganizationAPI) RemoveTags(id int, tags []string) error {
	return o.modifyTags(id, tags, "DELETE")
}

func (o *httpOrganizationAPI) modifyTags(id int, tags []string, method string) error {
	tr := tagsRequest(tags)
	b, err := json.Marshal(&tr)
	if err != nil {
		return fmt.Errorf("failed marshaling JSON request: %v", err)
	}

	u := o.client.baseURL()
	u.Path = fmt.Sprintf("/api/v2/organizations/%d/tags.json", id)

	req, err := http.NewRequest(method, u.String(), bytes.NewReader(b))
	if err != nil {
		return fmt.Errorf("failed creating HTTP request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	res, err := o.client.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP request failed: %v", err)
	}
	defer res.Body.Close()

	err = checkForAPIError(res)
	if err != nil {
		return err
	}

	return nil
}

type organizationResponse Organization

func (r *organizationResponse) UnmarshalJSON(d []byte) error {
	var dec struct {
		Organization *Organization `json:"organization"`
	}
	if err := json.Unmarshal(d, &dec); err != nil {
		return err
	}
	if dec.Organization == nil {
		return errors.New("object does not contain organization")
	}
	*r = organizationResponse(*dec.Organization)
	return nil
}

type organizationsResponse []Organization

func (r *organizationsResponse) UnmarshalJSON(d []byte) error {
	var dec struct {
		Organizations []Organization `json:"organizations"`
	}
	if err := json.Unmarshal(d, &dec); err != nil {
		return err
	}
	*r = organizationsResponse(dec.Organizations)
	return nil
}

type organizationCreateRequest Organization

func (r *organizationCreateRequest) MarshalJSON() ([]byte, error) {
	cr := struct {
		Name       string   `json:"name"`
		ExternalID string   `json:"external_id"`
		Tags       []string `json:"tags"`
	}{
		Name:       r.Name,
		ExternalID: r.ExternalID,
		Tags:       r.Tags,
	}
	return json.Marshal(map[string]interface{}{"organization": cr})
}

type tagsRequest []string

func (r *tagsRequest) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string][]string{"tags": []string(*r)})
}

var (
	OrganizationTagDelinquent = "delinquent"
	OrganizationTagFraudulent = "fraudulent"
	OrganizationTagTerminated = "terminated"

	OrganizationTags = []string{
		OrganizationTagDelinquent,
		OrganizationTagFraudulent,
		OrganizationTagTerminated,
	}
)

func DiffOrganizationTags(got, want, whitelist []string) (add []string, remove []string, ok bool) {
	gotIndex := make(map[string]struct{})
	whitelistIndex := make(map[string]struct{})
	wantIndex := make(map[string]struct{})

	for _, tag := range got {
		gotIndex[tag] = struct{}{}
	}
	for _, tag := range want {
		wantIndex[tag] = struct{}{}
	}
	for _, tag := range whitelist {
		whitelistIndex[tag] = struct{}{}
	}

	for _, tag := range got {
		// filter out tags not in the whitelist
		if _, ok := whitelistIndex[tag]; !ok {
			continue
		}
		// if an existing tag is not wanted, mark it for removal
		if _, ok := wantIndex[tag]; !ok {
			remove = append(remove, tag)
		}
	}

	for _, tag := range want {
		// filter out tags not in the whitelist
		if _, ok := whitelistIndex[tag]; !ok {
			continue
		}
		// if a wanted tag does not exist, mark it for addition
		if _, ok := gotIndex[tag]; !ok {
			add = append(add, tag)
		}
	}

	ok = (len(add) == 0) && (len(remove) == 0)
	return
}
